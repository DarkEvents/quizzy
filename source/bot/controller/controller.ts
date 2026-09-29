import { Context, Markup } from "telegraf";
import DataDB, { Conf, ConfirmInput } from '../db/DataDB';
import GoalDB from "../db/GoalDB";
import { TranslationKeys, i18n } from '../../../locales/lang';
import { SELECT_ANSWER_INIT_ALL, SELECT_ANSWER_INIT_FILT, SELECT_QUIZ_INIT, SELECT_QUIZ_NUMBER, SELECT_VELA_INIT, SELECT_VELA_NUMBER } from "../db/queries";
import * as fs from 'fs'

interface Handler {
	[key: number]: NodeJS.Timeout | undefined; // definizione per gli indici numerici
}

const handler: Handler = {};

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

export const confirm = async (ctx: any, next: () => void) => {
	if (ctx.chat?.type == 'private') {
		const paymentType = ctx.match[0].split("-")[2] ?? '';
		const paymentDay = ctx.match[0].split("-")[3];
		const subscriptionEndDate = new Date();
		subscriptionEndDate.setDate(subscriptionEndDate.getDate() + parseInt(paymentDay as string) + 2);
		subscriptionEndDate.toISOString().slice(0, 19).replace('T', ' ').split(" ")[0]
		const params: ConfirmInput = {
			priceId: ctx.match[0].split("-")[1] ?? '0',
			paymentType: paymentType,
			paymentDay: paymentDay ?? '',
			chatId: ctx.chat.id,
			username: ctx.chat.username ?? '',
			firstName: ctx.chat.first_name,
			ownerId: ctx.from?.id,
			subscriptionEndDate: subscriptionEndDate,
		};
		const confirm = await DataDB.confirm(params);
		if (confirm.code === -1) {
			ctx.reply(i18n.t.errorMessage);
			return;
		}
		ctx.reply(paymentType + "\n" + i18n.t.confirmed.replace("%uid", ctx.from?.id));
	} else {
		ctx.reply(i18n.t.executeonbot);
	}
	next();
};

export const priceList = async (ctx: Context) => {
	const result = await DataDB.prizeList()
	if (result.code === -1) {
		ctx.reply(i18n.t.errorMessage);
		return;
	}
	let prices = [];
	for (const el of result.data) {
		prices.push([Markup.button.url(`${el.description} - ${el.price}`, `https://www.paypal.me/testaroberto/${el.price}`), Markup.button.callback(`${i18n.t.payed} - ${el.description}`, `confirm-${el.id}-${el.description}-${el.day_duration}`)]);
	};
	let keyboardPrice = Markup.inlineKeyboard(prices);
	ctx.reply(i18n.t.paypal.replace(/%uid/g, ctx.from?.id), keyboardPrice);

}

export const setLang = async (ctx: any, lang: TranslationKeys) => {
	const result = await DataDB.setLang(lang, ctx.chat.id);
	if (result.code === -1) {
		ctx.reply(i18n.t.errorMessage);
		return;
	}
	deleteActiveQuiz(ctx);
	ctx.reply(i18n.t.configuredMessage);
}

export const initLang = async (ctx: any, lang: TranslationKeys) => {
	let result;
	i18n.iLang = lang;
	if ('username' in ctx.chat) {
		result = await DataDB.createConfig(ctx.chat.id, lang, ctx.chat.username, ctx.from.id);
	} else {
		const inviteLink = await ctx.telegram.exportChatInviteLink(ctx.chat.id)
		result = await DataDB.createConfig(ctx.chat.id, lang, inviteLink, ctx.from.id);
	}
	if (result.code === -1) {
		ctx.reply(i18n.t.botAlreadyInitiated);
	} else {
		ctx.reply(i18n.t.botInitiated);
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

export const langKeyboard = async (ctx: Context, operation: string) => {
	let keyboardShowVote;
	const result = await DataDB.foundLang(ctx.chat?.id ?? 0)
	if (result.code === -1) {
		ctx.reply(i18n.t.errorMessage);
		return;
	}
	if (result.data && result.data.length !== 0) {
		if (operation == 'Update') {
			if (result.data[0]?.lang === 'it') {
				keyboardShowVote = Markup.inlineKeyboard([
					Markup.button.callback("En - 🇬🇧", "en-u")
				]);
			} else {
				keyboardShowVote = Markup.inlineKeyboard([
					Markup.button.callback("It - 🇮🇹", "it-u"),
				]);
			}
			ctx.reply(i18n.t.chooseLangAndMoreMessage, keyboardShowVote);
		} else {
			ctx.replyWithHTML(i18n.t.botAlreadyInitiated);
		}
	} else {
		if (operation === 'init') {
			keyboardShowVote = Markup.inlineKeyboard([
				Markup.button.callback("It - 🇮🇹", "it-i"),
				Markup.button.callback("En - 🇬🇧", "en-i")
			]);
			ctx.reply(i18n.t.chooseLangMessage, keyboardShowVote);
		}
		if (operation === 'Update') {
			ctx.reply(i18n.t.toUseStartMessage);
		}
	}
}

const continueQuiz = async (ctx: Context, lang: TranslationKeys) => {

	const result = await DataDB.restartQuiz(ctx.chat?.id ?? 0, lang);
	if (result.code === -1) {
		ctx.reply(i18n.t.errorMessage);
		return;
	}
	if (result && result.data.length !== 0) {
		if (result.data[0]?.status === 'run' || result.data[0]?.status === 'pause') {
			const answers = result.data[0]?.answer ?? '[]';
			const type = result.data[0]?.type ?? '';
			await showQuiz(ctx, result.data[0].question, answers, result.data[0].mask, result.data[0].id, result.data[0].img ? result.data[0].img : 'quiz.jpg', type);
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

const endQuiz = async (ctx: Context) => {
	const result = await DataDB.endQuiz(ctx.chat?.id ?? 0)
	if (result.code === -1) {
		ctx.reply(i18n.t.errorMessage);
		return;
	}
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
export const answerRun = async (ctx: Context, userName: string, userRole: string) => {
	try {
		const result = await DataDB.selectConfig(ctx.chat ? ctx.chat.id : 0);
		if (result.code === -1) {
			ctx.reply(i18n.t.errorMessage);
			return;
		}

		if (result.data && result.data.length === 1) {
			let lang = result.data[0]?.lang ?? 'en';
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
				await isQuizExecutable(ctx, subscription, async () => {
					let queryQuiz = SELECT_ANSWER_INIT_FILT;
					let params = [ctx.chat?.id, categories.split(","), lang, lang];
					if (categories.split(',').length == 1 && categories.split(',')[0]?.toLowerCase() == 'all') {
						queryQuiz = SELECT_ANSWER_INIT_ALL;
						params = [ctx.chat?.id, lang, lang];
					}
					const qInit = await DataDB.getAnswerInit(queryQuiz, params);
					if (qInit.code === -1) {
						ctx.reply(i18n.t.errorMessage);
						return;
					}

					const question = qInit.data[0]?.question ?? '';
					const answers = qInit.data[0]?.answer ?? '[]';
					const answer = JSON.parse(answers)[0];
					const type = qInit.data[0]?.type ?? '';
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
						await showQuiz(ctx, question, answers, mask, id ?? 0, img, type);
					}
				})
			} else {
				// quiz already started o paused
				// run => run re-start if not started
				// pause => run tell quiz is posed use /continue command
				if (session.data[0]?.status === 'run' || session.data[0]?.status === 'pause') {
					continueQuiz(ctx, lang);
				};
			}
		} else {
			ctx.reply(i18n.t.toUseStartMessage);
		}
	} catch (error: any) {
		console.log(error.message)
	}
}
export const quizRun = async (ctx: Context, userName: string, userRole: string, qNumber: string) => {
	try {
		const result = await DataDB.selectConfig(ctx.chat ? ctx.chat.id : 0, true);
		if (result.code === -1) {
			ctx.reply(i18n.t.errorMessage);
			return;
		}

		if (result.data && result.data.length === 1) {
			let subscription = result.data[0]?.subscription ?? 0;
			await isQuizExecutable(ctx, subscription, async () => {
				let queryQuiz = SELECT_QUIZ_INIT;
				let params = [ctx.chat?.id];
				if (qNumber) {
					queryQuiz = SELECT_QUIZ_NUMBER;
					params = [ctx.chat?.id, 2000 + Number(qNumber)];
				}
				const qInit = await DataDB.getAnswerInit(queryQuiz, params);
				if (qInit.code === -1) {
					ctx.reply(i18n.t.errorMessage);
					return;
				}
				if (qInit.code === 0) {
					const qReset = await DataDB.resetQuiz();
					if (qReset.code === -1) {
						ctx.reply(i18n.t.errorMessage);
						return;
					}
					ctx.reply(i18n.t.quizReset);
					return;
				}
				const question = qInit.data[0]?.question ?? '';
				const answers = qInit.data[0]?.answer ?? '[]';
				const type = qInit.data[0]?.type ?? '';
				const id = qInit.data[0]?.id;
				const img = qInit.data[0]?.img ? qInit.data[0]?.img : 'quiz.jpg';
				if (qInit && qInit.data.length !== 0) {
					// TODO: error to check
					//@ts-ignore to check title
					const result = await DataDB.addSession(ctx.chat?.id ?? 0, ctx.chat?.title, userName, userRole, 'end', id ?? 0, 'quiz');
					if (result.code === -1) {
						ctx.reply(i18n.t.errorMessage);
						return;
					}
					await showQuiz(ctx, question, answers, '', id ?? 0, 'nautica/' + img, type);
				}
			})
		} else {
			ctx.reply(i18n.t.toUseStartMessage);
		}
	} catch (error: any) {
		console.log(error.message)
	}
}
export const velaRun = async (ctx: Context, userName: string, userRole: string, qNumber: string) => {
	try {
		const result = await DataDB.selectConfig(ctx.chat ? ctx.chat.id : 0, true);
		if (result.code === -1) {
			ctx.reply(i18n.t.errorMessage);
			return;
		}

		if (result.data && result.data.length === 1) {
			let subscription = result.data[0]?.subscription ?? 0;
			await isQuizExecutable(ctx, subscription, async () => {
				let queryQuiz = SELECT_VELA_INIT;
				let params = [ctx.chat?.id];
				if (qNumber) {
					queryQuiz = SELECT_VELA_NUMBER;
					params = [ctx.chat?.id, 4000 + Number(qNumber)];
				}
				const qInit = await DataDB.getAnswerInit(queryQuiz, params);
				if (qInit.code === -1) {
					ctx.reply(i18n.t.errorMessage);
					return;
				}
				if (qInit.code === 0) {
					const qReset = await DataDB.resetQuiz('vela');
					if (qReset.code === -1) {
						ctx.reply(i18n.t.errorMessage);
						return;
					}
					ctx.reply(i18n.t.quizReset);
					return;
				}
				const question = qInit.data[0]?.question ?? '';
				const answers = qInit.data[0]?.answer ?? '[]';
				const type = qInit.data[0]?.type ?? '';
				const id = qInit.data[0]?.id;
				const img = qInit.data[0]?.img ? qInit.data[0]?.img : 'quiz.jpg';
				if (qInit && qInit.data.length !== 0) {
					// TODO: error to check
					//@ts-ignore to check title
					const result = await DataDB.addSession(ctx.chat?.id ?? 0, ctx.chat?.title, userName, userRole, 'end', id ?? 0, 'quiz');
					if (result.code === -1) {
						ctx.reply(i18n.t.errorMessage);
						return;
					}
					await showQuiz(ctx, question, answers, '', id ?? 0, 'nautica/' + img, type);
				}
			})
		} else {
			ctx.reply(i18n.t.toUseStartMessage);
		}
	} catch (error: any) {
		console.log(error.message)
	}
}

const deleteActiveQuiz = async (ctx: Context) => {
	try {
		const result = await DataDB.deleteSession(ctx.chat?.id ?? 0)
		if (result.code === -1) {
			ctx.reply(i18n.t.errorMessage);
			return;
		}
	} catch (error: any) {
		console.log(error.message)
	}
}

const showQuiz = async (ctx: Context, question: string, answers: string, mask: string, qID: number, img: string, type: string) => {
	try {

		if (type === 'answer') {
			const answer = JSON.parse(answers)[0];
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
		}
		if (type === 'quiz') {
			const qAnswers = await DataDB.getQuizAnswers(qID);
			if (qAnswers.code === -1) {
				ctx.reply(i18n.t.noNewQuestions);
				return;
			}
			const answerList: Array<string> = JSON.parse(answers);
			const captionText = "Quiz patente nautica DD 131 DEL 31 MAGGIO 2022\r\n\r\n" + '#' + (qID - 2000) + '\r\n\r\n' + question;
			const keyboardStatus = Markup.inlineKeyboard([
				Markup.button.callback(`Mostra Informazioni`, `show-stats-${qID}`),
				Markup.button.url('Approfondisci', 'https://www.theeventhorizon.it/patente-nautica')
			]);
			ctx.replyWithPhoto({ source: fs.createReadStream('./resources/images/' + img) }, {
				caption: captionText,
				reply_markup: keyboardStatus.reply_markup
			},)
				.then(() => {
					const correctIdx = answerList[3];
					const keyboard = Markup.inlineKeyboard([
						[Markup.button.callback("1️⃣", `reply-1-${correctIdx}-${qID}-${ctx.from?.id}`),
						Markup.button.callback("2️⃣", `reply-2-${correctIdx}-${qID}-${ctx.from?.id}`),
						Markup.button.callback("3️⃣", `reply-3-${correctIdx}-${qID}-${ctx.from?.id}`)]
					]);
					ctx.replyWithHTML('#' + (qID - 2000) + '\r\n\💬 ' + qAnswers.data[0]?.count + '\r\n\r\n' + question + '\r\n\r\n' + '1️⃣ ' + answerList[0] + '\r\n' + '2️⃣ ' + answerList[1] + '\r\n' + '3️⃣ ' + answerList[2], keyboard)
				})
		}
		if (type === 'vela') {
			const qAnswers = await DataDB.getQuizAnswers(qID);
			if (qAnswers.code === -1) {
				ctx.reply(i18n.t.noNewQuestions);
				return;
			}
			const answerList: Array<string> = JSON.parse(answers);
			const captionText = "Quiz patente nautica DD 131 DEL 31 MAGGIO 2022\r\n\r\n" + '#' + (qID - 4000) + '\r\n\r\n' + question;
			const keyboardStatus = Markup.inlineKeyboard([
				Markup.button.callback(`Mostra Informazioni`, `show-stats-${qID}`),
				Markup.button.url('Approfondisci', 'https://www.theeventhorizon.it/patente-nautica')
			]);
			ctx.replyWithPhoto({ source: fs.createReadStream('./resources/images/' + img) }, {
				caption: captionText,
				reply_markup: keyboardStatus.reply_markup
			},)
				.then(() => {
					const correctIdx = answerList[3];
					const keyboard = Markup.inlineKeyboard([
						[Markup.button.callback("1️⃣   " + answerList[0], `reply-1-${correctIdx}-${qID}-${ctx.from?.id}`),
						Markup.button.callback("2️⃣   " + answerList[1], `reply-2-${correctIdx}-${qID}-${ctx.from?.id}`)]
					]);
					ctx.replyWithHTML('#' + (qID - 4000) + '\r\n\💬 ' + qAnswers.data[0]?.count + '\r\n\r\n' + question, keyboard)
				})
		}
	} catch (error: any) {
		console.log(error.message)
	}
}

export const delcateg = (ctx: Context) => {
	getConfig(ctx, async (conf) => {
		let newCategory: any[] = [];
		const category = await DataDB.getAllCategory(i18n.lang)
		if (category.code === -1) {
			ctx.reply(i18n.t.errorMessage);
			return;
		}
		let callbackArray: Array<any> = [];
		if (category.data.length !== 0) {
			let partialArray: Array<any> = [];
			let last;
			category.data.forEach(el => {
				// @ts-ignore check ctx.match
				if (conf.categories.split(",").indexOf(el.id + "") != -1 && ctx.match[0].split("-")[1] != el.id) {
					partialArray.push(Markup.button.callback(`✅ ${el.description}`, `delcateg-${el.id}`));
					newCategory.push(el.id);
				} else {
					partialArray.push(Markup.button.callback(`❌ ${el.description}`, `addcateg-${el.id}`));
				}
				last = partialArray;
				if (partialArray.length == 2) {
					callbackArray.push(partialArray);
					partialArray = [];
					last = '';
				}
			});
			if (last) {
				callbackArray.push(last);
			}
		}
		let keyboardQuizCategory = Markup.inlineKeyboard(callbackArray);
		ctx.editMessageText(i18n.t.chooseCategoryMessage, keyboardQuizCategory);
		updateCategory(ctx, newCategory, ctx.chat?.id ?? 0);
	});
}

export const addcateg = (ctx: Context) => {
	getConfig(ctx, async (conf) => {
		let newCategory: any[] = [];
		const category = await DataDB.getAllCategory(i18n.lang)
		if (category.code === -1) {
			ctx.reply(i18n.t.errorMessage);
			return;
		}

		let callbackArray: Array<any> = [];
		let last;
		if (category.data.length !== 0) {
			let partialArray: Array<any> = [];
			category.data.forEach(el => {
				//@ts-ignore
				if (conf.categories.split(",").indexOf(el.id + "") != -1 || ctx.match[0].split("-")[1] == el.id) {
					partialArray.push(Markup.button.callback(`✅ ${el.description}`, `delcateg-${el.id}`));
					newCategory.push(el.id);
				} else {
					partialArray.push(Markup.button.callback(`❌ ${el.description}`, `addcateg-${el.id}`));
				}
				last = partialArray;
				if (partialArray.length == 2) {
					callbackArray.push(partialArray);
					partialArray = [];
					last = '';
				}
			});
			if (last) {
				callbackArray.push(last);
			}
		}
		let keyboardQuizCategory = Markup.inlineKeyboard(callbackArray);
		ctx.editMessageText(i18n.t.chooseCategoryMessage, keyboardQuizCategory);
		updateCategory(ctx, newCategory, ctx.chat?.id ?? 0);
		deleteActiveQuiz(ctx);
	});
}

export const categoriesCommand = (ctx: Context) => {
	getConfig(ctx, async (conf) => {
		if (conf.subscription == 0) {
			ctx.reply(i18n.t.forPremiumUser);
			return;
		}
		const category = await DataDB.getAllCategory(i18n.lang)
		if (category.code === -1) {
			ctx.reply(i18n.t.errorMessage);
			return;
		}

		let callbackArray: Array<any> = [];
		if (category.data.length !== 0) {
			let partialArray: Array<any> = [];
			let last;
			category.data.forEach(el => {
				if (conf.categories.split(",").indexOf(el.id + "") != -1) {
					partialArray.push(Markup.button.callback(`✅ ${el.description}`, `delcateg-${el.id}`));
				} else {
					partialArray.push(Markup.button.callback(`❌ ${el.description}`, `addcateg-${el.id}`));
				}
				last = partialArray;
				if (partialArray.length == 2) {
					callbackArray.push(partialArray);
					partialArray = [];
					last = '';
				}
			});
			if (last) {
				callbackArray.push(last);
			}
		}
		let keyboardQuizCategory = Markup.inlineKeyboard(callbackArray);
		ctx.reply(i18n.t.chooseCategoryMessage, keyboardQuizCategory);
	});
}
// new Commands
export const enableAutoCastCommand = (ctx: Context) => {
	if (handler[ctx.chat?.id ?? '0'] === undefined) {
		if (ctx.chat?.type == 'private') {
			ctx.reply(i18n.t.nothere);
			return;
		}
		// let funcUser = isAdmin.bind(enableAutoCastCommand);
		// funcUser(ctx);

		//@ts-ignore check .text
		let timing = ctx.message?.text.split(' ')[1];
		if (timing == undefined || timing < 60) {
			timing = 60;
		}
		if (timing > 360) {
			timing = 360;
		}
		timing = (timing * 60) * 1000; // timing in milliseconds

		handler[ctx.chat?.id ?? '0'] = setInterval(() => {
			const birthday = new Date();
			const start = new Date(birthday.getFullYear(), birthday.getMonth(), birthday.getDate(), 8);
			const end = new Date(birthday.getFullYear(), birthday.getMonth(), birthday.getDate(), 23, 0);
			const now = new Date();

			if (now.getTime() > start.getTime() && now.getTime() < end.getTime()) {
				answerRun(ctx, `ID:${ctx.from?.id}-@${ctx.from?.username}`, 'Auto-cast');
				// ctx.reply('hahaha')
			} else {
				clearInterval(handler[ctx.chat?.id ?? '0']);
				handler[ctx.chat?.id ?? '0'] = undefined;
			}
		}, timing); // timing in milliseconds
	}
	ctx.reply(i18n.t.aStarted)
		.then((sub) => {
			setTimeout(() => {
				ctx.deleteMessage(sub.message_id).catch(() => console.log('Message not found'));
			}, 10000);
		});
}
export const disableAutoCastCommand = (ctx: Context) => {
	if (handler[ctx.chat?.id ?? '0'] != undefined) {
		if (ctx.chat?.type == 'private') {
			ctx.reply(i18n.t.nothere);
			return;
		}
		// let funcUser = isAdmin.bind(disableAutoCastCommand);
		// funcUser(ctx);
		clearInterval(handler[ctx.chat?.id ?? '0']);
		handler[ctx.chat?.id ?? '0'] = undefined;
		ctx.reply('Autocast disabled').then((sub) => {
			setTimeout(() => {
				ctx.deleteMessage(sub.message_id).catch(() => console.log('Message not found'));
			}, 10000);
		});
	}
}

export const statusCommand = (ctx: Context) => {
	getConfig(ctx, async (conf) => {
		if (conf.subscription == 0) {
			ctx.reply(i18n.t.forPremiumUser);
			return;
		}
		const category = await DataDB.getAllCategory(i18n.lang)
		if (category.code === -1) {
			ctx.reply(i18n.t.errorMessage);
			return;
		}

		let callbackArray: Array<any> = [];
		if (category.data.length !== 0) {
			let partialArray: Array<any> = [];
			category.data.forEach(el => {
				if (conf.categories.split(",").indexOf(el.id + "") != -1) {
					partialArray.push(Markup.button.callback(`✅ ${el.description}`, `delcateg-${el.id}`));
				} else {
					partialArray.push(Markup.button.callback(`❌ ${el.description}`, `addcateg-${el.id}`));
				}
				if (partialArray.length == 2) {
					callbackArray.push(partialArray);
					partialArray = [];
				}
			});
		}
		let keyboardQuizCategory = Markup.inlineKeyboard(callbackArray);
		ctx.reply(i18n.t.chooseCategoryMessage, keyboardQuizCategory);
	});
}
export const rank = async (ctx: Context) => {
	const chat = ctx.chat;
	const from = ctx.from;
	if (!chat || !from) return;
	const result = await DataDB.rank(chat.id);
	if (result.code === -1) {
		ctx.reply(i18n.t.errorMessage);
		return;
	}

	let flatRank = ['', '', '', '', '', '', '', '', '', ''];
	let arrayRank = [[], [], [], [], [], [], [], [], [], []];
	for (const el of result.data) {
		if (el.rango == 4) {
			break;
		}
		//@ts-ignore
		arrayRank[el.rango - 1].push(el.first_name);
		//@ts-ignore
		flatRank[el.rango - 1] = arrayRank[el.rango - 1].length !== 0 ? arrayRank[el.rango - 1].join(",") + ` ${i18n.t.pointWord}: (${el.points})` : i18n.t.nobodyMessage;
	};
	ctx.replyWithHTML("🥇 -> " + flatRank[0] + "\r\n🥈 -> " + flatRank[1] + "\r\n🥉 -> " + flatRank[2]);
	ctx.deleteMessage().catch(() => console.log('Message not found'));
}
export const rank10 = async (ctx: Context) => {
	const chat = ctx.chat;
	const from = ctx.from;
	if (!chat || !from) return;
	const result = await DataDB.rank(chat.id);
	if (result.code === -1) {
		ctx.reply(i18n.t.errorMessage);
		return;
	}
	let flatRank = ['', '', '', '', '', '', '', '', '', ''];
	let arrayRank = [[], [], [], [], [], [], [], [], [], []];
	for (const el of result.data) {
		if (el.rango == 11) {
			break;
		}
		//@ts-ignore
		arrayRank[el.rango - 1].push(el.first_name);
		//@ts-ignore
		flatRank[el.rango - 1] = arrayRank[el.rango - 1].length !== 0 ? arrayRank[el.rango - 1].join(",") + ` ${i18n.t.pointWord}: (${el.points})` : i18n.t.nobodyMessage;
	};
	ctx.replyWithHTML("🥇 -> " + flatRank[0] + "\r\n🥈 -> " + flatRank[1] + "\r\n🥉 -> " + flatRank[2] + "\r\n4 -> " + flatRank[3] + "\r\n5 -> " + flatRank[4] + "\r\n6 -> " + flatRank[5] + "\r\n7 -> " + flatRank[6] + "\r\n8 -> " + flatRank[7] + "\r\n9 -> " + flatRank[8] + "\r\n10 -> " + flatRank[9]);

	ctx.deleteMessage().catch(() => console.log('Message not found'));
}
export const myRank = async (ctx: Context) => {
	const chat = ctx.chat;
	const from = ctx.from;
	if (!chat || !from) return;
	const result = await DataDB.rank(chat?.id ?? 0);
	if (result.code === -1) {
		ctx.reply(i18n.t.errorMessage);
		return;
	}
	if (result.data && result.data.length !== 0) {
		const position = result.data.find(el => el.usertelegramid == from?.id)?.rango;
		if ('title' in chat) {
			ctx.replyWithHTML(from?.first_name + ' ' + i18n.t.positionMessage.replace('%pos', position).replace('%gname', chat?.title));
		} else {
			ctx.replyWithHTML(from?.first_name + ' ' + i18n.t.positionMessage.replace('%pos', position));
		}
	} else {
		ctx.replyWithHTML(i18n.t.noRank);
	}

	ctx.deleteMessage().catch(() => console.log('Message not found'));
}
export const eventText = async (ctx: Context) => {
	//@ts-ignore
	if ((ctx.message?.hasOwnProperty('reply_to_message') && (ctx.message.reply_to_message?.from?.username?.toLowerCase() == "QuizGenix_bot".toLowerCase()) || ctx.message.reply_to_message?.from?.username == "ltd_testingbot")) { //QuizGenix_bot
		if (ctx.message?.from.username == undefined) {
			ctx.replyWithHTML(i18n.t.noUsername);
			return;
		}
		//@ts-ignore
		const sol = ctx.message.text;
		//@ts-ignore to check id caption exists
		const quizId = ctx.message?.reply_to_message?.caption?.split('\n')[0].substring(6);
		if (quizId == undefined || !quizId) {
			// ctx.reply(i18n.t.responseOnlyToMessage);
			return;
		}
		// Use the connection
		const result = await DataDB.quizToReply(quizId, ctx.chat?.id ?? 0, i18n.iLang)
		if (result.code === -1) {
			ctx.replyWithHTML(i18n.t.error);
		}
		if (result.data.length !== 0) {
			const answers = result.data[0]?.answer ?? '[]';
			const answer = JSON.parse(answers)[0];
			const sid = result.data[0]?.sid ?? 0;
			const status = result.data[0]?.status
			if (typeof ctx.chat?.id !== 'undefined' && status === 'run' && sol.toLowerCase() === answer?.toLowerCase()) {
				const result = await DataDB.insertIntoUser(sid, ctx.message.from.id, ctx.message.from.username, ctx.message.from.first_name, typeof ctx.message.from.last_name !== 'undefined' ? ctx.message.from.last_name : "-", 1)
				if (result.code === -1) {
					ctx.replyWithHTML(i18n.t.error);
				}
				endQuiz(ctx);
				ctx.replyWithHTML(i18n.t.builtBy, { disable_web_page_preview: true }).then(() => ctx.replyWithPhoto({ source: fs.createReadStream('./resources/images/and-the-winner-is.jpg') }, { caption: i18n.t.youGuess_message.replace('%name', ctx.message?.from.first_name) + answer }));

			} else {
				if (typeof ctx.chat?.id === 'undefined') {
					ctx.reply(i18n.t.notActiveQuiz);
				} else {
					if (status === 'end') {
						ctx.reply(i18n.t.closedQuizMessage);
					} else {
						if (status === 'pause') {
							ctx.reply(i18n.t.pausedQuizMessage);
						} else {
							ctx.replyWithPhoto({ source: fs.createReadStream('./resources/images/incorrect.jpg') }, { caption: i18n.t.tryAgainMessage })
								.then((sub) => {
									setTimeout(() => {
										ctx.deleteMessage(sub.message_id).catch(() => console.log('Message not found'));
									}, 10000);
								});
						}
					}
				}
			}
		} else {
			ctx.reply(i18n.t.cannotRespondMessage)
				.then((sub) => {
					setTimeout(() => {
						ctx.deleteMessage(sub.message_id).catch(() => console.log('Message not found'));
					}, 10000);
				});
		}

	}
}

const isQuizExecutable = async (ctx: Context, premium: number, func: () => void) => {
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
export const updateQuizResult = async (responseIdx: number, correctIdx: number, quizId: number, userTelegramId: number, first: string, last: string, username: string) => {
	const result = await DataDB.updateQuizResult(responseIdx === correctIdx, quizId, userTelegramId, first, last, username)
	if (result.code === -1) {
		return 0;
	}
	return 1;
}
