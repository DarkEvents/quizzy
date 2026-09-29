import * as mysql from "mysql2";
import * as poolDataConnection from './db-conn-local.json';
import { SELECT_INFO } from "./queries";


export interface Result<T> {
	code: number;
	message: string;
	data: Array<T>;
}
type SubInfo = {
	goal: number;
	subGoal: number;
	currentMonth: string
}

export default new class GoalDB {
	private poolData!: mysql.Pool;

	private promisePool: any;

	constructor() {
		this.poolData = mysql.createPool({
			host: poolDataConnection.dbhost,
			user: poolDataConnection.dbuser,
			password: poolDataConnection.dbpassword,
			database: poolDataConnection.dbgoal,
			port: poolDataConnection.dbport,
			waitForConnections: true,
			connectionLimit: 10,
			queueLimit: 0
		});

		this.promisePool = this.poolData.promise();
	}

	async executeTransaction(queryFunction: (promisePool: mysql.PoolConnection) => Promise<void>): Promise<any> {
		await this.promisePool.query('START TRANSACTION');

		try {
			await queryFunction(this.promisePool);
			await this.promisePool.query('COMMIT');
		} catch (err: any) {
			await this.promisePool.query('ROLLBACK');
			console.error(err.message);
			throw err; // Rilancia l'errore dopo aver gestito la transazione
		}
	}

	async subInfo(): Promise<Result<SubInfo>> {
		const result: Result<SubInfo> = {
			code: 0,
			message: "ok",
			data: []
		}

		try {
			//@ts-ignore
			const [results]: [mysql.RowDataPacket[], any] = await this.promisePool.query(SELECT_INFO)

			if (results && results.length == 1) {
				result.data.push({
					goal: results[0]?.goal,
					subGoal: results[0]?.share ? results[0].share : 0,
					currentMonth: results[0]?.YMonth
				})
			}
		} catch (error: any) {
			result.code = -1;
			result.message = error.message
			console.log(error.message)
		}

		return result;


	}

	// async getQuestion(id: number): Promise<Question> {
	// 	//@ts-ignore
	// 	const [rows]: [mysql.RowDataPacket[], any] = await this.promisePool.query('SELECT * FROM questions WHERE id = ?', [id]);
	// 	const row = rows[0];
	// 	if (!row) return {
	// 		id: 0,
	// 		question: '',
	// 		answers: [],
	// 		correctAnswerIndex: 1,
	// 		quizNumber: '',
	// 		photo: 'default.jpeg'
	// 	}
	// 	return {
	// 		id: row.id,
	// 		question: row.question,
	// 		answers: [row.answer1, row.answer2, row.answer3],
	// 		correctAnswerIndex: row.correct_answer,
	// 		quizNumber: row.quiz_number,
	// 		photo: row.photo
	// 	};
	// }

	// async getCorrectAnswer(id: number): Promise<number> {
	// 	//@ts-ignore
	// 	const [rows]: [mysql.RowDataPacket[], any] = await this.connection.execute('SELECT correctAnswerIndex FROM questions WHERE id = ?', [id]);
	// 	const row = rows[0];
	// 	if (!row) return -1
	// 	return row[0];
	// }
	// /**
	//  *
	//  */

	// async addUser(user: any) {
	// 	const { id, first_name, last_name, username } = user;
	// 	await this.promisePool.execute('INSERT INTO user (user_id, first_name, last_name, username) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE first_name = ?, last_name = ?, username = ?', [id, first_name, last_name, username, first_name, last_name, username]);
	// }

	// async initializeBotInGroup(data: any) {
	// 	const { fromId, chatId, fromFirsName, fromUsername, chatName, chatType, chatLink } = data;
	// 	this.executeTransaction(async (promisePool) => {
	// 		try {
	// 			await promisePool.query<mysql.RowDataPacket[any]>(
	// 				`  INSERT
	//                             INTO user
	//                                 (telegram_user_id, first_name, username)
	//                         VALUES (?, ?, ? )
	//                 ON DUPLICATE KEY
	//                         UPDATE first_name = ?,
	//                                 username = ?`,
	// 				[fromId, fromFirsName, fromUsername, fromFirsName, fromUsername]
	// 			);

	// 			await promisePool.query<mysql.RowDataPacket[any]>(
	// 				`INSERT
	//                     INTO chat (telegram_chat_id, telegram_owner_id_fk, chat_link, name, type)
	//                 VALUES (?, ?, ?, ?, ?)
	//             ON DUPLICATE KEY
	//                       UPDATE telegram_owner_id_fk = ?,
	//                                 chat_link = ?,
	//                                 name = ?,
	//                                 type = ? `,
	// 				[chatId, fromId, chatLink, chatName, chatType, fromId, chatLink, chatName, chatType]
	// 			);
	// 		} catch (error) {
	// 			console.log(error.message)
	// 		}
	// 	});
	// }

	// async addQuizInteraction(chatId: number, questionId: number, userId: number, response: number) {
	// 	await this.promisePool.execute('INSERT INTO quizinteractions (chat_id_fk, question_id_fk, user_id_fk, quiz_response) VALUES (?, ?, ?, ?)', [chatId, questionId, userId, response]);
	// }
}
