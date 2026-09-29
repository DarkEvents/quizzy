import { Context, Markup } from "telegraf";
import { i18n } from "../../../locales/lang";
import DataDB from "../db/DataDB";
import { getConfig, isAdmin, quizStart } from "../utilities";

const priceList = async (ctx: Context) => {
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

export default new class CommandHandler {
	showPrice = (ctx: Context) => {
		if (ctx.chat?.type == 'private') {
			priceList(ctx);
		} else {
			ctx.reply(i18n.t.executeonbot);
		}
		ctx.deleteMessage().catch(() => console.log('Message not found'));
	}
	quiz = (ctx: Context) => {
		getConfig(ctx, (conf) => {
			let funcUser = isAdmin.bind(quizStart);
			funcUser(ctx, conf.lang);
		});
		ctx.deleteMessage().catch(() => console.log('Message not found'));
	}
}

