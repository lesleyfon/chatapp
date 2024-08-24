export interface UserInterface {
	id: number;
	name: string;
	email: string;
	password: string;
	createdAt?: string;
	updatedAt?: string;
}
class HttpServer {
	authBasePath = "http://localhost:3010/auth";
	// getUserId() {
	// 	return new Promise((resolve, reject) => {
	// 		try {
	// 			resolve(localStorage.getItem("userid"));
	// 		} catch (error) {
	// 			reject(error);
	// 		}
	// 	});
	// }

	// removeLS() {
	// 	return new Promise((resolve, reject) => {
	// 		try {
	// 			localStorage.removeItem("userid");
	// 			localStorage.removeItem("username");
	// 			resolve(true);
	// 		} catch (error) {
	// 			reject(error);
	// 		}
	// 	});
	// }

	// setLS(key: string, value: string) {
	// 	return new Promise((resolve, reject) => {
	// 		try {
	// 			localStorage.setItem(key, value);
	// 			resolve(true);
	// 		} catch (error) {
	// 			reject(error);
	// 		}
	// 	});
	// }

	async login(userCredential: { email: string; password: string }) {
		try {
			const myHeaders = new Headers();
			myHeaders.append("Content-Type", "application/json");
			const raw = JSON.stringify(userCredential);

			const response = await fetch("http://localhost:3010/auth/login", {
				method: "POST",
				headers: myHeaders,
				body: raw,
				redirect: "follow",
			});
			const result = await response.text();
			return result;
		} catch (error) {
			return error;
		}
	}
	async register(userCredential: { email: string; password: string; name: string }) {
		try {
			const myHeaders = new Headers();
			myHeaders.append("Content-Type", "application/json");
			const raw = JSON.stringify(userCredential);

			const response = await fetch("http://localhost:3010/auth/register", {
				method: "POST",
				headers: myHeaders,
				body: raw,
				redirect: "follow",
			});
			const result = await response.text();
			return result;
		} catch (error) {
			return error;
		}
	}

	// checkUsernameAvailability(username) {
	// 	return new Promise(async (resolve, reject) => {
	// 		try {
	// 			const response = await axios.post("http://localhost:4000/usernameAvailable", {
	// 				username: username,
	// 			});
	// 			resolve(response.data);
	// 		} catch (error) {
	// 			reject(error);
	// 		}
	// 	});
	// }

	// register(userCredential) {
	// 	console.log(userCredential);
	// 	return new Promise(async (resolve, reject) => {
	// 		try {
	// 			const response = await axios.post("http://localhost:4000/register", userCredential);
	// 			resolve(response.data);
	// 		} catch (error) {
	// 			reject(error);
	// 		}
	// 	});
	// }

	// userSessionCheck(userId) {
	// 	return new Promise(async (resolve, reject) => {
	// 		try {
	// 			const response = await axios.post("http://localhost:4000/userSessionCheck", {
	// 				userId: userId,
	// 			});
	// 			resolve(response.data);
	// 		} catch (error) {
	// 			reject(error);
	// 		}
	// 	});
	// }

	// getMessages(userId, toUserId) {
	// 	return new Promise(async (resolve, reject) => {
	// 		try {
	// 			const response = await axios.post("http://localhost:4000/getMessages", {
	// 				userId: userId,
	// 				toUserId: toUserId,
	// 			});
	// 			console.log(response);
	// 			resolve(response.data);
	// 		} catch (error) {
	// 			reject(error);
	// 		}
	// 	});
	// }
}

export default new HttpServer();
