import { existsSync, readFileSync } from 'fs';
import { message } from 'telegraf/filters'
import * as path from 'path';
import { Telegraf, Context } from 'telegraf';
import { i18n } from '../../locales/lang';
import { isAdmin } from './utilities';
import { addcateg, categoriesCommand, confirm, delcateg, disableAutoCastCommand, enableAutoCastCommand, eventText, getConfig, initLang, langKeyboard, myRank, priceList, answerRun, rank, rank10, setLang, statusCommand, updateQuizResult, quizRun, velaRun } from './controller/controller';
import DataDB from './db/DataDB';

export const token =
	(existsSync(path.join(__dirname, 'bot-token.txt')) && readFileSync(path.join(__dirname, 'bot-token.txt'), 'utf8').trim()) ||
	process.env.BOT_TOKEN;
if (!token) {
	throw new Error(
		'You have to provide the bot-token from @BotFather via file (bot-token.txt) or environment variable (BOT_TOKEN)'
	);
}
// const responseIcon = ['1️⃣','2️⃣', '3️⃣'];
const bot = new Telegraf<Context>(token);

bot.start((ctx: any) => {
	getConfig(ctx, () => {
		langKeyboard(ctx, "init");
	});
});

bot.help((ctx) => {
	ctx.reply(i18n.t.helpDescr)
});

bot.action(/confirm-.+/, (ctx, next) => confirm(ctx, next));
bot.action(/addcateg-.+/, (ctx, next) => {
	let funcUser = isAdmin.bind(addcateg);
	funcUser(ctx);
	next();
});

bot.action(/delcateg-.+/, (ctx, next) => {
	let funcUser = isAdmin.bind(delcateg);
	funcUser(ctx);
	next();
});

bot.action('en-i', (ctx, next) => {
	let funcUser = isAdmin.bind(initLang);
	i18n.iLang = 'en';
	funcUser(ctx, 'en');
	ctx.deleteMessage().catch(() => console.log('Message not found'));
	next();
});

bot.action('it-i', (ctx, next) => {
	let funcUser = isAdmin.bind(initLang);
	i18n.iLang = 'it';
	funcUser(ctx, 'it');
	ctx.deleteMessage().catch(() => console.log('Message not found'));
	next();
});

bot.action('en-u', (ctx, next) => {
	let funcUser = isAdmin.bind(setLang);
	i18n.iLang = 'en';
	funcUser(ctx, 'en');
	ctx.deleteMessage().catch(() => console.log('Message not found'));
	next();
});

bot.action('it-u', (ctx, next) => {
	let funcUser = isAdmin.bind(setLang);
	i18n.iLang = 'it';
	funcUser(ctx, 'it');
	ctx.deleteMessage().catch(() => console.log('Message not found'));
	next();
});
bot.action(/reply-(\d+)-(\d+)-(\d+)-(\d+)/, (ctx) => {
	const responseIdx = Number(ctx.match[1] ?? 0);
	const correctIdx = Number(ctx.match[2]);
	const quizId = Number(ctx.match[3]);
	getConfig(ctx, async () => {
		if (await updateQuizResult(responseIdx, correctIdx, quizId, ctx.from?.id ?? 0, ctx.from?.first_name ?? '', ctx.from?.last_name ?? '', ctx.from?.username ?? '') === 0) {
			ctx.answerCbQuery("Non puoi rispondere al quiz. Hai già risposto!", { show_alert: true });
		} else {
			const qAnswers = await DataDB.getQuizAnswers(quizId);

			//@ts-ignore
			let captionText = ctx.callbackQuery.message?.text??'';
			//@ts-ignore
			let replyMarkup = ctx.callbackQuery.message?.reply_markup;

			// Sostituisci la seconda riga con un nuovo testo
			captionText = captionText.replace(/\n.+\n/, '\n💬 '+qAnswers.data[0]?.count+'\n');

			ctx.editMessageText(captionText, {reply_markup: replyMarkup});

			if (qAnswers.code === -1) {
				ctx.reply(i18n.t.noNewQuestions);
				return;
			}
			if (responseIdx === correctIdx) {
				ctx.answerCbQuery("Bravo Messieur/madame, Risposta esatta!", { show_alert: true });
			} else {
				ctx.answerCbQuery(`Risposta errata!\r\nLa risposta corretta è la #${correctIdx}\r\nApprofondisci su:\r\ntheeventhorizon.it/patente-nautica`, { show_alert: true });
			}
		}
	});
});

bot.action(/show-stats-(\d+)/, async (ctx) => {
	const quizId = Number(ctx.match[1]);
	DataDB.getQuizStatistic(ctx.from?.id ?? 0, quizId)
		.then((result) => {
			if (result.code === -1) {
				ctx.reply(i18n.t.errorMessage);
				return;
			}
			if (result.data[0]?.hasVoted) {
				const response = JSON.parse(result.data[0].answer);
				const correctAnsPos = result.data[0].correctAnsPosition;
				ctx.answerCbQuery(`Risposta corretta: #${correctAnsPos} ${response[correctAnsPos-1].substring(0,100)}... \n\nRisposte corrette: ${result.data[0].correct}\nRisposte sbagliate: ${result.data[0].wrong}`, { show_alert: true })
			} else {
				ctx.answerCbQuery(`Prima di visionare le statistiche devi rispondere al quiz!`, { show_alert: false })
			}
		}
		);
});


bot.command('showprice', (ctx) => {
	if (ctx.chat.type == 'private') {
		priceList(ctx);
	} else {
		ctx.reply(i18n.t.executeonbot);
	}
	ctx.deleteMessage().catch(() => console.log('Message not found'));
})
bot.command('question', (ctx) => {
	getConfig(ctx, (conf) => {
		let funcUser = isAdmin.bind(answerRun);
		funcUser(ctx, conf.lang);
	});
	ctx.deleteMessage().catch(() => console.log('Message not found'));
})
bot.command('hint', (ctx) => {
	getConfig(ctx, (conf) => {
		let funcUser = isAdmin.bind(answerRun);
		funcUser(ctx, conf.lang);
	});
	ctx.deleteMessage().catch(() => console.log('Message not found'));
})
bot.command('nautical', (ctx) => {
	const qNumber = ctx.message.text.split(' ')[1];
	getConfig(ctx, (conf) => {
		let funcUser = isAdmin.bind(quizRun);
		funcUser(ctx, conf.lang, qNumber);
	});
	ctx.deleteMessage().catch(() => console.log('Message not found'));
})
bot.command('sail', (ctx) => {
	const qNumber = ctx.message.text.split(' ')[1];
	getConfig(ctx, (conf) => {
		let funcUser = isAdmin.bind(velaRun);
		funcUser(ctx, conf.lang, qNumber);
	});
	ctx.deleteMessage().catch(() => console.log('Message not found'));
})

bot.command('rank', rank)

bot.command('rank10', rank10)

bot.command('myrank', myRank)

bot.command('categories', (ctx) => {
	if (ctx.chat.type == 'private') {
		ctx.reply(i18n.t.nothere);
		return;
	}
	let funcUser = isAdmin.bind(categoriesCommand);
	funcUser(ctx);
	ctx.deleteMessage().catch(() => console.log('Message not found'));
})
// new commands
bot.command('enableac', (ctx) => {
	let funcUser = isAdmin.bind(enableAutoCastCommand);
	funcUser(ctx);

	ctx.deleteMessage().catch(() => console.log('Message not found'));
})

bot.command('disableac', (ctx) => {

	let funcUser = isAdmin.bind(disableAutoCastCommand);
	funcUser(ctx);
	ctx.deleteMessage().catch(() => console.log('Message not found'));

})
bot.command('status', (ctx) => {
	if (ctx.chat.type == 'private') {
		ctx.reply(i18n.t.nothere);
		return;
	}
	let funcUser = isAdmin.bind(statusCommand);
	funcUser(ctx);
	ctx.deleteMessage().catch(() => console.log('Message not found'));
})


bot.command('lang', (ctx) => {
	getConfig(ctx, () => {
		let funcUser = isAdmin.bind(langKeyboard);
		funcUser(ctx, "Update");
	});
	ctx.deleteMessage().catch(() => console.log('Message not found'));
})


bot.on(message('text'), (ctx) => {
	getConfig(ctx, (_conf) => eventText(ctx));
})

bot.catch((error: any) => {
	console.error('telegraf error occured', error.message);
});
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


export async function start(): Promise<void> {
	// The commands you set here will be shown as /commands like /start or /magic in your telegram client.
	await bot.telegram.setMyCommands([
		{ command: 'help', description: "/help - List of command." },
		{ command: 'start', description: "/start - This command have to be executed the first time to initialize the bot." },
		{ command: 'question', description: "/question or /hint - Add a new letter to a quiz, if no quiz is not started a new one is started. (Only Owner or admin)." },
		{ command: 'hint', description: "/hint or /question - Add a new letter to a Quiz. (Only Owner or admin). If no quiz is started a new one is started." }, //Avvia un quiz. (solo un Admin o l'owner)
		{ command: 'nautical', description: "/nautical - start a random nautical quiz. Can pass the quiz number to show specific one (Only Owner or admin)." },
		{ command: 'sail', description: "/sail - start a random sail quiz. Can pass the quiz number to show specific one (Only Owner or admin)." },
		{ command: 'lang', description: "Allow to change language, support only it and en (Only Owner or admin)." }, //permette di impostare la lingua (solo un Admin o l'owner)
		{ command: 'rank', description: 'Show first three positions with related points.' }, //Mostra i primi tre classificati. (tutti i menbri possono eseguirlo)
		{ command: 'rank10', description: 'Show first ten positions with related points, all member can use but in Premium bot.' }, //Mostra le prime dieci posizioni. (tutti i menbri possono eseguirlo) solo per bot premium
		{ command: 'myrank', description: 'Using this command each user can show his/her position.' }, //In risposta a questo comando viene fornita la posizione in classifica (tutti i menbri possono eseguirlo)
		{ command: 'categories', description: 'This command allow admin to choose the quiz category to show (Only Premium User can use).' },
		{ command: 'showprice', description: 'This command show the price for premium version (Only Creator can use) or any people but inside the bot.' },
		{ command: 'enableac', description: 'This command enable autocast of hint, can set a time in minute between 60 and 360 minutes, run only between 08:00 and 23:00 out of this time autocast will be automatically disabled (Only Premium can use).' },
		{ command: 'disableac', description: 'This command disable autocast of hint (Only Premium can use).' },
	]);
	await bot.launch();
}
