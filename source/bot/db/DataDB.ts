import { Result } from './GoalDB';
import * as mysql from "mysql2";
import * as poolDataConnection from './db-conn-local.json';
import { CREATE_CONFIG, DELETE_SESSION, INSERT_INTO_SESSION, INSERT_INTO_USER, INSERT_PAYED, PREMIUM_PRICE, RESET_QUIZ_SESSION, SELECT_ALL_CATEGORY, SELECT_CONFIG, SELECT_CONFIG_QUIZ, SELECT_FOUND_LANG, SELECT_FROM_SESSION, SELECT_QUIZ_ANSWERS, SELECT_QUIZ_COUNTER, SELECT_QUIZ_RESTART, SELECT_QUIZ_STATS, SELECT_QUIZ_TOREPLY, SELECT_RANK, UPDATE_CATEGORY, UPDATE_LANG, UPDATE_MASK, UPDATE_QUIZ_RESULT, UPDATE_SESSION_STATUS, UPDATE_SUBSCRIPTION } from './queries';
import { PoolConnection } from 'mysql2/promise';
import { TranslationKeys } from '../../../locales/lang';

export interface QuizStats {
	hasVoted: boolean,
	correct: number;
	wrong: number;
	answer: string;
	correctAnsPosition: number;
}
export interface Category {
	id: number;
	description: string;
}
export interface AnswerInit {
	id: number;
	question: string;
	answer: string;
	img: string;
	type: string;
}
export interface QuizInit_ {
	id: number;
	question: string;
	answer: string;
	img: string;
	type: string;
}
export interface Session {
	id: number;
	quiz_id_fk: number;
	chat_id: number;
	group_title: string;
	user_name: string;
	user_role: string;
	status: string;
	mask: string;
}
export interface IsQuizExecutable {
	isEnabled: number;
}
export interface Quiz2Restart {
	id: number;
	question: string;
	answer: string;
	status: string;
	mask: string;
	img: string;
	count: number;
	type: string;
}
export interface Quiz2Result {
	id: number;
	count: number;
}
export interface Quiz2Reply extends Quiz2Restart {
	sid: number;
}
export interface Lang {
	found: number;
	lang: TranslationKeys;
}
export interface Rank {
	usertelegramid: number;
	username: string;
	firstName: string
	points: number;
	rango: number;
}
export interface Prize {
	id: number;
	description: string;
	day_duration: number,
	price: number
}
export interface ConfirmInput {
	priceId: string;
	paymentType: string;
	paymentDay: string;
	chatId: number;
	username: string;
	firstName: string;
	ownerId: number | undefined;
	subscriptionEndDate: Date;
}

export interface Conf {
	lang: TranslationKeys;
	subscription: number;
	subscription_end_date: Date;
	categories: string;
	sub_descr: string | null;
	sub_day: string | null;
	sub_price: number;
}

export default new class DataDB {
	private poolData!: mysql.Pool;

	private promisePool: PoolConnection;

	constructor() {
		this.poolData = mysql.createPool({
			host: poolDataConnection.dbhost,
			user: poolDataConnection.dbuser,
			password: poolDataConnection.dbpassword,
			database: poolDataConnection.dbname,
			port: poolDataConnection.dbport,
			waitForConnections: true,
			connectionLimit: 10,
			queueLimit: 0
		});

		this.promisePool = this.poolData.promise();
	}

	async executeTransaction(queryFunction: (promisePool: PoolConnection) => Promise<void>): Promise<any> {
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
	async selectConfig(chatId: number, isQuiz = false): Promise<Result<Conf>> {
		const result: Result<Conf> = {
			code: 0,
			message: "ok",
			data: []
		}

		try {
			let query = SELECT_CONFIG;
			if (isQuiz) {
				query = SELECT_CONFIG_QUIZ;
			}
			const [rows]: [mysql.RowDataPacket[], any] = await this.promisePool.query(query, [chatId]);
			const row = rows[0];
			if (!row || !rows || rows.length === 0) return result;

			result.data.push({
				lang: row.lang,
				subscription: row.subscription,
				subscription_end_date: row.subscription_end_date,
				categories: row.categories,
				sub_descr: row.sub_descr,
				sub_day: row.sub_day,
				sub_price: row.sub_price
			})

		} catch (error: any) {
			result.code = -1;
			result.message = error.message
			console.log(error.message)
		}
		return result;
	}

	async confirm(param: ConfirmInput): Promise<Result<undefined>> {
		const result: Result<undefined> = {
			code: 0,
			message: '',
			data: []
		}
		this.executeTransaction(async (promisePool) => {
			try {
				await promisePool.query<mysql.RowDataPacket[any]>(INSERT_PAYED,
					[param.chatId, param.username, param.firstName, param.priceId, 1, param.username, param.firstName, param.priceId]
				);

				await promisePool.query<mysql.RowDataPacket[any]>(UPDATE_SUBSCRIPTION,
					[param.subscriptionEndDate, param.ownerId]
				);
			} catch (error: any) {
				result.code = -1;
				result.message = error.message;
				console.log(error.message)
			}
		})
		return result
	}

	async prizeList() {
		const result: Result<Prize> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			const [rows]: [mysql.RowDataPacket[], any] = await this.promisePool.execute(PREMIUM_PRICE);
			if (!rows || rows.length === 0) return result;
			result.data = rows as Array<Prize>
		} catch (error: any) {
			result.code = -1;
			result.message = error.message
			console.log(error.message)
		}
		return result;
	}
	async rank(chatId: number): Promise<Result<Rank>> {
		const result: Result<Rank> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			const [rows]: [mysql.RowDataPacket[], any] = await this.promisePool.query(SELECT_RANK, [chatId]);

			if (!rows || rows.length === 0) return result;

			result.data = rows as Array<Rank>;
		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}
	async setLang(lang: TranslationKeys, chatId: number) {
		const result: Result<{}> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			await this.promisePool.query(UPDATE_LANG, [lang, chatId]);

		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}

	async createConfig(chatId: number, lang: TranslationKeys, val: string, fromId: number) {
		const result: Result<{}> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			await this.promisePool.query(CREATE_CONFIG, [chatId, val, fromId, lang],);

		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}

	async updateCategory(categ: string, categoryId: number) {
		const result: Result<{}> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			await this.promisePool.query(UPDATE_CATEGORY, [categ, categoryId]);

		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}

	async foundLang(chatId: number): Promise<Result<Lang>> {
		const result: Result<Lang> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			const [rows]: [mysql.RowDataPacket[], any] = await this.promisePool.query(SELECT_FOUND_LANG, [chatId]);
			if (!rows || rows.length === 0) return result;
			result.data = rows as Array<Lang>;
		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}

	async quizToReply(quizId: number, chatId: number, lang: TranslationKeys): Promise<Result<Quiz2Reply>> {
		const result: Result<Quiz2Reply> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			const [rows]: [mysql.RowDataPacket[], any] = await this.promisePool.query(SELECT_QUIZ_TOREPLY, [quizId, chatId, lang]);
			if (!rows || rows.length === 0) return result;
			result.data = rows as Array<Quiz2Reply>;
		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}

	async insertIntoUser(sessionId: number, usertelegramid: number, username: string, firstName: string, lastName: string, points: number) {
		const result: Result<{}> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			await this.promisePool.query(INSERT_INTO_USER, [sessionId, usertelegramid, username, firstName, lastName, points]);

		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}


	async restartQuiz(chatId: number, lang: TranslationKeys): Promise<Result<Quiz2Restart>> {
		const result: Result<Quiz2Restart> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			const [rows]: [mysql.RowDataPacket[], any] = await this.promisePool.query(SELECT_QUIZ_RESTART, [chatId, lang]);
			if (!rows || rows.length === 0) return result;
			result.data = rows as Array<Quiz2Restart>;
		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}
	async getQuizAnswers(quizId: number): Promise<Result<Quiz2Result>> {
		const result: Result<Quiz2Result> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			const [rows]: [mysql.RowDataPacket[], any] = await this.promisePool.query(SELECT_QUIZ_ANSWERS, [quizId]);
			if (!rows || rows.length === 0) return result;
			result.data = rows as Array<Quiz2Result>;
		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}

	async updateMask(mask: string, chatId: number, quizId: number) {
		const result: Result<{}> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			await this.promisePool.query(UPDATE_MASK, [mask, chatId, quizId]);
		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}
	async endQuiz(chatId: number) {
		const result: Result<{}> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			await this.promisePool.query(UPDATE_SESSION_STATUS, [chatId]);
		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}

	async isQuizExecutable(premium: number, chatId: number): Promise<Result<IsQuizExecutable>> {
		const result: Result<IsQuizExecutable> = {
			code: 0,
			message: "ok",
			data: []
		}

		try {
			const [rows]: [mysql.RowDataPacket[], any] = await this.promisePool.query(SELECT_QUIZ_COUNTER, [premium, chatId]);
			if (!rows || rows.length === 0) return result;
			result.data = rows as Array<IsQuizExecutable>;
		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}
	async getFromSession(chatId: number): Promise<Result<Session>> {
		const result: Result<Session> = {
			code: 0,
			message: "ok",
			data: []
		}

		try {
			const [rows]: [mysql.RowDataPacket[], any] = await this.promisePool.query(SELECT_FROM_SESSION, [chatId]);
			if (!rows || rows.length === 0) return result;
			result.data = rows as Array<Session>;
		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}
	async getAnswerInit(query: string, params: Array<number | string[] | TranslationKeys | undefined>): Promise<Result<AnswerInit>> {
		const result: Result<AnswerInit> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			const [rows]: [mysql.RowDataPacket[], any] = await this.promisePool.query(query, params);
			result.code = rows.length;
			if (!rows || rows.length === 0) return result;
			result.data = rows as Array<AnswerInit>;
		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}

	async resetQuiz(type= 'quiz'): Promise<Result<AnswerInit>> {
		const result: Result<AnswerInit> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			const [rows]: [mysql.RowDataPacket[], any] = await this.promisePool.query(RESET_QUIZ_SESSION, [type]);
			if (!rows || rows.length === 0) return result;
			result.data = rows as Array<AnswerInit>;
		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}

	async addSession(chatId: number, chatTitle: string, userName: string, userRole: string, status: string, id: number, mask: string) {
		const result: Result<{}> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			await this.promisePool.query(INSERT_INTO_SESSION, [chatId, chatTitle, userName, userRole, status, id, mask]);
		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}
	async deleteSession(chatId: number) {
		const result: Result<{}> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			await this.promisePool.query(DELETE_SESSION, [chatId]);
		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}

	async getAllCategory(lang: TranslationKeys): Promise<Result<Category>> {
		const result: Result<Category> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			const [rows]: [mysql.RowDataPacket[], any] = await this.promisePool.query(SELECT_ALL_CATEGORY, lang);
			if (!rows || rows.length === 0) return result;
			result.data = rows as Array<Category>;
		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}
	async getQuizStatistic(userId: number, quizId: number): Promise<Result<QuizStats>> {
		const result: Result<QuizStats> = {
			code: 0,
			message: "ok",
			data: [{
				hasVoted: false,
				correct: 0,
				wrong: 0,
				correctAnsPosition: -1,
				answer: ''
			}]
		}
		try {
			const [rows]: [mysql.RowDataPacket[], any] = await this.promisePool.query(SELECT_QUIZ_STATS, [userId, quizId]);
			if (!rows || rows.length === 0) return result;
			result.data = rows as Array<QuizStats>;
		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}
	async updateQuizResult(response: boolean, quizId: number, userTelegramId: number, first: string, last: string, username: string) {
		const result: Result<{}> = {
			code: 0,
			message: "ok",
			data: []
		}
		try {
			await this.promisePool.query(UPDATE_QUIZ_RESULT, [quizId, userTelegramId, username, first, last, response]);

		} catch (error: any) {
			result.code = -1;
			result.message = error.message;
			console.log(error.message);
		}
		return result;
	}
}
