import * as fs from 'fs';
import GoalDB from './db/GoalDB';
import DataDB, { Conf } from './db/DataDB';
import { TranslationKeys, i18n } from '../../locales/lang';
import { Context } from 'telegraf';
import { SELECT_ANSWER_INIT_ALL, SELECT_ANSWER_INIT_FILT } from './db/queries';

export const isAdmin = function (this: any, ...params: any[]) {
	const ctx = params[0];
	const lang = params[1];
	const nQuiz = params[2];
	ctx.telegram.getChatMember(ctx.chat.id, ctx.from?.id)
		.then((res: { user: { is_bot: any; id: any; username: any; }; status: string; }) => {
			//console.log(res);
			try {
				if (!res.user.is_bot) {
					if (res.status === 'administrator' || res.status === 'creator') {
						if (this.name == 'setLang' || this.name == 'initLang') {
							this(ctx, lang);
						}
						if (this.name == 'langKeyboard') {
							this(ctx, params[1]); //operation
						}
						if (this.name == 'answerRun') {
							this(ctx, `ID:${res.user.id}-@${res.user.username}`, res.status);
						}
						if (this.name == 'quizRun' || this.name == 'velaRun') {
							this(ctx, `ID:${res.user.id}-@${res.user.username}`, res.status, nQuiz);
						}
						if (this.name == 'quizNext' || this.name == 'enableAutoCastCommand' || this.name == 'disableAutoCastCommand' || this.name == 'categoriesCommand' || this.name == 'addcateg' || this.name == 'delcateg' || this.name == 'priceList' || this.name == 'statusCommand') {
							this(ctx);
						}
					} else {
						ctx.replyWithPhoto({ source: fs.createReadStream('./resources/images/forbidden.jpg') }, { caption: i18n.t.mustAdmin })
							.then((sub: { message_id: any; }) => {
								setTimeout(() => {
									ctx.deleteMessage(sub.message_id).catch(() => console.log('Message not found'));
								}, 10000);
							})
							.catch(() => console.log("error replyWithPhoto"));
					}
				}
			} catch (error) {
				console.log("error");
			}
		})
		.catch(() => console.log("error getChatMember"));
};

export const getConfig = async (ctx: Context, func: (conf: Conf) => void) => {
	let conf: Conf = {
		lang: 'en',
		subscription: 0,
		subscription_end_date: new Date(),
		categories: 'all',
		sub_descr: null,
		sub_day: null,
		sub_price: 0,
	}
	try {
		if (ctx.chat?.type == 'private') {
			const result = await GoalDB.subInfo();
			if (result.code === -1) {
				ctx.reply(i18n.t.errorMessage);
				return;
			}
			const goal = result.data[0]?.goal;
			const subGoal = result.data[0]?.subGoal;
			const currentMonth = result.data[0]?.currentMonth;
			ctx.reply(i18n.t.goalInfo.replace('month_tag', currentMonth).replace('subgoal_tag', subGoal).replace('goal_tag', goal));
			return;
		}
		const result = await DataDB.selectConfig(ctx.chat ? ctx.chat.id : 0);
		if (result.code === -1) {
			ctx.reply(i18n.t.errorMessage);
			return;
		}

		if (result.data && result.data.length === 1) {
			i18n.lang = result.data[0]?.lang ?? 'en';
			conf = {
				lang: result.data[0]?.lang ?? 'en',
				subscription: result.data[0]?.subscription ?? 0,
				subscription_end_date: result.data[0]?.subscription_end_date ?? new Date(),
				categories: result.data[0]?.categories ?? '',
				sub_descr: result.data[0]?.sub_descr ?? '',
				sub_day: result.data[0]?.sub_day ?? '',
				sub_price: result.data[0]?.sub_price ?? 0
			}
		}
		try {
			func(conf);
		} catch (error) {
			ctx.reply(i18n.t.errorMessage);
			console.log('Error Running function inside getConfig: ', conf)
		}
	} catch (error) {
		console.log('Get Config Error: ', conf)
	}
}

async function isQuizExecutable(ctx: Context, premium: number, func: () => void) {
	const result = await DataDB.isQuizExecutable(premium, ctx.chat?.id ?? 0)
	if (result.code === -1) {
		ctx.reply(i18n.t.errorMessage);
		return 0;
	}
	if (result && result.data.length === 1) {
		if (result.data[0]?.isEnabled === 1) {
			func();
		} else {
			if (premium == 0) {
				ctx.reply(i18n.t.cannotExecuteQuizTodayStandard);
			} else {
				ctx.reply(i18n.t.cannotExecuteQuizToday);
			}
			return 0;
		}
	}
	return 1;
}

/**
 * hide not discovered char
 */
const hide = function (solution: string, posix: Array<string>) {
	let result = Array(solution.length + 1).join('_ ');
	var chars = result.split('');
	for (let index = 0; index < posix.length; index++) {
		const showChar = posix[index] === '0' ? '_' : (solution[index] ?? '?');
		chars[index * 2] = showChar;
	}
	return chars.join('');
}

const endQuiz = async (ctx: Context) => {
	const result = await DataDB.endQuiz(ctx.chat?.id ?? 0)
	if (result.code === -1) {
		ctx.reply(i18n.t.errorMessage);
		return;
	}
}


const startQuiz = function (ctx: Context, question: string, answer: string, mask: string, qID: number, img: string) {
	getConfig(ctx, (_conf) => {
		// console.log('comp '+complementary);
		var complementary = new Array();
		let tmp = mask.split("");
		for (var i = 0; i < answer.length; i++) {
			if (tmp[i] === '0') {
				complementary.push(i);
			}
		}
		tmp[complementary[Math.floor(Math.random() * complementary.length)]] = '1';
		// console.log('mask '+mask);
		mask = tmp.join("");
		updateMask(ctx, mask, qID);
		const str = hide(answer, mask.split(""));
		if (complementary.length == 1) {
			endQuiz(ctx);
			ctx.reply(i18n.t.noResponseMessage + str);
		} else {
			ctx.replyWithPhoto({ source: fs.createReadStream('./resources/images/' + img) }, { caption: i18n.t.solveMessage.replace('%id', qID).replace('%question', question) + str })
			// console.log(str);
		}
	});
}


const restartQuiz = async (ctx: Context, lang: TranslationKeys) => {

	const result = await DataDB.restartQuiz(ctx.chat?.id ?? 0, lang);
	if (result.code === -1) {
		ctx.reply(i18n.t.errorMessage);
		return;
	}
	if (result && result.data.length !== 0) {
		if (result.data[0]?.status === 'run' || result.data[0]?.status === 'pause') {
			// const answers = result.data[0]?.answer.replace(/'/g, '"')?? '[]';
			const answers = result.data[0]?.answer;
			startQuiz(ctx, result.data[0].question, answers, result.data[0].mask, result.data[0].id, result.data[0].img ? result.data[0].img : 'quiz.jpg');
		} else {
			ctx.reply(i18n.t.noQuizActive_message);
		}
	} else {
		ctx.reply(i18n.t.noQuizActive_message);
	}
}
const updateMask = async (ctx: Context, mask: string, quizId: number) => {
	const result = await DataDB.updateMask(mask, ctx.chat?.id ?? 0, quizId)
	if (result.code === -1) {
		ctx.reply(i18n.t.errorMessage);
		return;
	}
}

const quizNext = async (ctx: Context) => {
	const result = await DataDB.selectConfig(ctx.chat ? ctx.chat.id : 0);
	if (result.code === -1) {
		ctx.reply(i18n.t.errorMessage);
		return;
	}
	if (result && result.data.length == 1) {
		let lang = result.data[0]?.lang ?? 'en';
		const session = await DataDB.getFromSession(ctx.chat?.id ?? 0);
		if (session.code === -1) {
			ctx.reply(i18n.t.errorMessage);
			return;
		}
		// new quiz to start
		// end => run retrieve the next quiz ad set the new id to quiz_id_fk
		// se il quiz non è attivo non fa nulla quindi questa parte va rimossa, perche delegata a quizStart
		if (session && session.data.length == 0) {
			ctx.replyWithHTML(i18n.t.noQuizActive_message);
			getConfig(ctx, (conf) => {
				let funcUser = isAdmin.bind(quizStart);
				funcUser(ctx, conf.lang);
			});
		} else {
			// quiz already started o paused
			// run => run re-start if not started
			// pause => run tell quiz is posed use /continue command
			if (session.data[0]?.status === 'run' || session.data[0]?.status === 'pause') {
				restartQuiz(ctx, lang );
			};
		}
	} else {
		ctx.reply(i18n.t.toUseStartMessage);
	}
}


export const quizStart = async (ctx: Context, userName: string, userRole: string) => {
	const result = await DataDB.selectConfig(ctx.chat ? ctx.chat.id : 0);
	if (result.code === -1) {
		ctx.reply(i18n.t.errorMessage);
		return;
	}

	if (result.data && result.data.length === 1) {
		let lang = result.data[0]?.lang;
		let categories = result.data[0]?.categories ?? '';
		let subscription = result.data[0]?.subscription ?? 0;
		const session = await DataDB.getFromSession(ctx.chat?.id ?? 0);
		if (session.code === -1) {
			ctx.reply(i18n.t.errorMessage);
			return;
		}
		// new quiz to start
		// end => run retrieve the next quiz ad set the new id to quiz_id_fk
		if (session && session.data.length == 0) {
			if (await isQuizExecutable(ctx, subscription, async () => {
				let queryQuiz = SELECT_ANSWER_INIT_FILT;
				let params = [ctx.chat?.id, categories.split(","), lang, lang];
				if (categories.split(',').length == 1 && categories.split(',')[0]?.toLowerCase() == 'all') {
					queryQuiz = SELECT_ANSWER_INIT_ALL;
					params = [ctx.chat?.id, lang, lang];
				}
				const qInit = await DataDB.getAnswerInit(queryQuiz, params);
				if (qInit.code === -1) {
					ctx.reply(i18n.t.noNewQuestions);
					return;
				}

				const question = qInit.data[0]?.question ?? '';
				const answers = qInit.data[0]?.answer.replace(/'/g, '"')?? '[]';
				const answer = JSON.parse(answers)[0];
				const id = qInit.data[0]?.id;
				const img = qInit.data[0]?.img ? qInit.data[0]?.img : 'quiz.jpg';
				if (qInit && qInit.data.length !== 0) {
					let mask = Array(answer.length + 1).join('0');
					for (let index = 0; index < mask.length; index++) {
						if (answer[index] == ' ' || answer[index] == '\'' || answer[index] == '`' || answer[index] == '"' || answer[index] == ',' || answer[index] == '.' || answer[index] == '-' || answer[index] == '_' || answer[index] == '$' || answer[index] == '’') {
							let chars = mask.split('');
							chars[index] = '1';
							mask = chars.join('');
						}
					}
					//@ts-ignore to check title
					const result = await DataDB.addSession(ctx.chat?.id ?? 0, ctx.chat?.title, userName, userRole, 'run', id ?? 0, mask);
					if (result.code === -1) {
						ctx.reply(i18n.t.errorMessage);
						return;
					}
					startQuiz(ctx, question, answer, mask, id ?? 0, img);
				}
			})) {
				//ntd
			}
		} else {
			getConfig(ctx, (conf) => {
				let funcUser = isAdmin.bind(quizNext);
				funcUser(ctx, conf.lang);
			});
			//ctx.replyWithHTML(i18n.t.quizalreadystarted );
		}
	} else {
		ctx.reply(i18n.t.toUseStartMessage);
	}
}

export const updateCategory = async (ctx: any, categories: any[], categoryId: number) => {
	let categ = categories.join(",");
	if (categ.length == 0) {
		categ = 'all';
	}
	const result = await DataDB.updateCategory(categ, categoryId);
	if (result.code === -1) {
		ctx.reply(i18n.t.errorMessage);
	}
}

export async function deleteActiveQuiz(ctx: Context) {
	const result = await DataDB.deleteSession(ctx.chat?.id ?? 0)
	if (result.code === -1) {
		ctx.reply(i18n.t.errorMessage);
		return;
	}
}
