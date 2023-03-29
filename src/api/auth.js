const express = require("express");
const router = express.Router();
const requireFields = require("./middleware/requireFields");
const countAccounts = require("../db/modules/account/count");
const createSecret = require("../db/modules/secret/create");

const {
	login,
	update: { email: updateEmail, password: updatePassword, username: updateUsername },
	register,
} = require("../db/modules/account");
const requireLogin = require("./middleware/requireLogin");

router.post("/login", requireFields(["username", "password"]), async (req, res) => {
	try {
		const { username, password } = req.body;

		const [data, error] = await login({
			username,
			password,
		});

		if (error)
			return res.status(error.code).json({
				success: false,
				message: error.message,
			});

		return res.status(200).json({
			success: true,
			result: data,
		});
	} catch (e) {
		console.log(e);
		return res.status(500).json({
			success: false,
			message: "Internal Server Error when logging in",
		});
	}
});

router.post("/register", requireFields(["email", "username", "password"]), async (req, res) => {
	const accountsCount = await countAccounts();
	if ((accountsCount !== 0 && process.env.ENABLE_REGISTRATION !== "true") || process.env.DEMO == "true")
		return res.status(412).json({
			success: false,
			message: "Registration is not enabled",
		});
	try {
		const { email, username, password } = req.body;

		const [data, error] = await register({
			email,
			username,
			password,
			role: accountsCount === 0 ? "admin" : "standard",
		});

		if (error)
			return res.status(error.code).json({
				success: false,
				message: error.message,
				details: error.details,
			});

		return res.status(200).json({
			success: true,
			result: data,
		});
	} catch (e) {
		console.log(e);
		return res.status(500).json({
			success: false,
			message: "Internal Server Error when registering",
		});
	}
});

router.get("/me", requireLogin(), async (req, res) => {
	try {
		const { email, id, username, role, secret } = req.account;

		return res.status(200).send({
			success: true,
			result: {
				email,
				id,
				username,
				role,
				secret,
			},
		});
	} catch (e) {
		console.log(e);
		return res.status(500).json({
			success: false,
			message: "Internal Server Error when getting current account",
		});
	}
});

router.patch("/email", requireLogin(true), requireFields(["newEmail", "password"]), async (req, res) => {
	if (process.env.DEMO === "true")
		return res.status(406).json({
			success: false,
			message: "Updating of credentials is not enabled in demo mode.",
		});
	try {
		const account = req.account;

		const { newEmail, password } = req.body;

		const [updateResponse, updateError] = await updateEmail({
			account,
			newEmail,
			password,
		});

		if (updateError)
			return res.status(updateError.code).json({
				success: false,
				message: updateError.message,
			});

		return res.status(200).json({
			success: true,
			result: updateResponse,
		});
	} catch (e) {
		console.log(e);
		return res.status(500).json({
			success: false,
			message: "Internal Server Error when updating email",
		});
	}
});

router.patch("/password", requireLogin(true), requireFields(["password", "newPassword"]), async (req, res) => {
	if (process.env.DEMO === "true")
		return res.status(406).json({
			success: false,
			message: "Updating of credentials is not enabled in demo mode.",
		});
	try {
		const account = req.account;
		
		const { password, newPassword } = req.body;

		const [updateResponse, updateError] = await updatePassword({
			account,
			password,
			newPassword,
		});

		if (updateError)
			return res.status(updateError.code).json({
				success: false,
				message: updateError.message,
			});

		return res.status(200).json({
			success: true,
			result: updateResponse,
		});
	} catch (e) {
		console.log(e);
		return res.status(500).json({
			success: false,
			message: "Internal Server Error when updating password",
		});
	}
});

router.patch("/username", requireLogin(true), requireFields(["newUsername", "password"]), async (req, res) => {
	if (process.env.DEMO === "true")
		return res.status(406).json({
			success: false,
			message: "Updating of credentials is not enabled in demo mode.",
		});
	try {
		const account = req.account;

		const { newUsername, password } = req.body;

		const [updateResponse, updateError] = await updateUsername({
			account,
			newUsername,
			password,
		});

		if (updateError)
			return res.status(updateError.code).json({
				success: false,
				message: updateError.message,
			});

		return res.status(200).json({
			success: true,
			result: updateResponse,
		});
	} catch (e) {
		console.log(e);
		return res.status(500).json({
			success: false,
			message: "Internal Server Error when updating username",
		});
	}
});

router.post("/newSecret", requireLogin(true), async function (req, res) {
	const secret = await createSecret(req.account);
	return res.status(200).json({
		success: true,
		result: {
			secret,
		},
	});
});

module.exports = router;
