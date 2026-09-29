const contactMail = 'theeventhorizon.it@gmail.com';
const brandURL = 'https://theeventhorizon.it';
const brandName = 'ArtySoft';

export type TranslationKeys = 'it' | 'en';

type Translations = {
	[key in TranslationKeys]?: {
		aStarted: string;
		quizReset: string;
		aStopped: string;
		noUsername: string;
		autocastenabled: string;
		autocastdisabled: string;
		quizalreadystarted: string;
		greating: string;
		builtBy: string;
		thankyouforInvocation: string;
		mustAdmin: string;
		errorMessage: string;
		nobodyMessage: string;
		pointWord: string;
		positionMessage: string;
		configuredMessage: string;
		botAlreadyInitiated: string;
		botInitiated: string;
		responseOnlyToMessage: string;
		notActiveQuiz: string;
		closedQuizMessage: string;
		pausedQuizMessage: string;
		tryAgainMessage: string;
		cannotRespondMessage: string;
		youGuess_message: string;
		noResponseMessage: string;
		noQuizActive_message: string;
		noNewQuestions: string;
		toUseStartMessage: string;
		chooseLangMessage: string;
		chooseLangAndMoreMessage: string;
		chooseCategoryMessage: string;
		solveMessage: string;
		forPremiumUser: string;
		nothere: string;
		goalInfo: string;
		noRank: string;
		paypal: string;
		payed: string;
		confirmed: string;
		executeonbot: string;
		helpDescr: string;
		cannotExecuteQuizToday: string;
  		cannotExecuteQuizTodayStandard: string;
    };
};

interface Config {
	iLang: TranslationKeys;
	translate: Translations;
	get t(): any;
	get lang(): TranslationKeys;
	set lang(lang: TranslationKeys);
}

export const i18n: Config = {
	iLang: 'en' as TranslationKeys,
	translate: {
		'it': {
			'quizReset': 'Bravo Messier/Madame!!! Hai completato il ciclo di tutti i test ministeriali per la patente nautica. Rilancia il comando /quiznautica per ricominciare dall\'inizio.',
			'aStarted': 'Autocast Attivo',
			'aStopped': 'Autocast Non attivo',
			'noUsername': 'Per poter partecipare devi avere un Username.',
			'autocastenabled': 'Autocast abilitato ogni ',
			'autocastdisabled': 'Autocast disabilitato ',
			'quizalreadystarted': 'Un quiz è già in esecuzione, un nuovo suggerimento è stato attivato. Per un nuovo suggerimento puoi usare il comando /hint@QuizGenix_bot',
			'greating': 'Ciao',
			'builtBy': `Bot realizato da <a href='${brandURL}'>${brandName}</a>`,
			'thankyouforInvocation': "Grazie per avermi invocato.\nQuesto bot è in beta testing e può, attualmente, essere usato solo dai creatori, seguiteci andremo online molto presto",
			'mustAdmin': 'Devi essere admin per poter usare questo comando.',
			'errorMessage': "errore",
			'nobodyMessage': "Nessuno",
			'pointWord': "punti",
			'positionMessage': `Ti trovi in %pos° posizione della classifica nel gruppo %gname`,
			'configuredMessage': "linguaggio configurato",
			'botAlreadyInitiated': "Il bot è già stato inizializzato usa i comandi specifici per le configurazioni\nEsegui il comando /help@QuizGenix_bot per la lista completa",
			'botInitiated': "Inizializzazione riuscita\nQuesta è la versione gratuita del bot se vuoi attivare tutte le funzionalita passa alla versione premium",
			'responseOnlyToMessage': "Rispondi solo al messaggio relativo alla domanda.\nGrazie.",
			'notActiveQuiz': "Al momento questo quiz non è attivo.",
			'closedQuizMessage': "Questo quiz è concluso.",
			'pausedQuizMessage': "Questo quiz è in pausa potrai ripondere appena sarà riattivato.",
			'tryAgainMessage': 'Ritenta non mollare',
			'cannotRespondMessage': "Non puoi rispondere a questo quiz.",
			'youGuess_message': "Grande!!! %name hai indovinato!\r\nLa soluzione al quiz è\r\n",
			'noResponseMessage': 'Nessuno ha risposto correttamente.\r\nLa soluzione è!!!\r\n',
			'noQuizActive_message': 'Un nuovo quiz è stato avviato.',
			'noNewQuestions': "Non ci sono altre domande nel database",
			'toUseStartMessage': "Per usare il comando devi prima inizializare il bot col comando /start@QuizGenix_bot",
			'chooseLangMessage': "scegli la lingua da usare",
			'chooseLangAndMoreMessage': "Scegli la lingua da usare\nATTENZIONE: L'eventuale quiz in esecuzione verrà resettato",
			'chooseCategoryMessage': "Scegli le categorie dei quiz che vuoi siano mostrati nel gruppo\nATTENZIONE: L'eventuale quiz in esecuzione verrà resettato",
			'solveMessage': 'Quiz #%id\r\nPer dare la soluzione rispondi a questo messaggio.\r\n\r\n%question\r\n',
			'forPremiumUser': 'Questo comando può essere invocato solo nella versione Premium del Bot\nUse /showprice per controllare i prezzi',
			'nothere': "Aggiungimi ad un gruppo e buon divertimento.",
			'goalInfo': "Il parziale di month_tag è subgoal_tag of goal_tag\r\n\r\nGrazie per l'interesse.\r\nSe puoi aiutaci a raggiungere l'obbiettivo mensile per permetterci di sostenere i costi dei server e e dello sviluppo\r\n\r\n Esegui il comando /showprice e segui le istruzioni questo aiuterà a mantenere the bot attivo. Grazie.\r\n\r\nQuesto comando deve essere eseguito all'interno del gruppo dove vuoi che agisca, aggiungimi e buon divertimento.",
			'noRank': "Non sei ancora qualificato.",
			'paypal':
				`Al momento l'unica modalita di pagamento supportata è PayPal
Esegui questi passi:
1. Procedi con il pagamento usando il pulsante a sinistra.
2. Nel commento di PayPal scrivi questo codice %uid
3. Per favore effettua il pagamento nella modalità "Invia denaro ad un amico"
4. A pagamento completato conferma col relativo pulsante 'Pagato' a destra del link usato.
La modalità Premium verrà attivata entro 48 ore dalla verifica del pagamento
IMPORTANTE: Senza scrivere nelle note del pagamento il codice %uid o non confermando con il pulsante 'Pagato', le tempistiche di attivazione della funzionalità Premium potrebbero richiedere molto più tempo o non essere attivate del tutto
Per eventuali problemi o chiarimenti potete mandare una mail all'indirizzo ${contactMail}`,
			'payed': "Pagato",
			'confirmed': `Grazie pe raver confermato il pagamento,\nla richiesta verrà presa in carico il prima possibile.\nSe hai dimenticato di scrivere nelle note del pagamenteo il codice %uid spediscilo via mail a ${contactMail}`,
			'executeonbot': "Questo comando deve essere eseguito direttamente sul bot @QuizGenix_bot",
			'helpDescr': `/quiz - Aggiunge una nuova lettera ad un quiz. Se nessun quis è in esecuzione ne fa partire uno nuovo. (Solo proprietario o un amministratore).
/hint - Aggiunge una nuova lettera ad un quiz. Se nessun quis è in esecuzione ne fa partire uno nuovo. (Solo proprietario o un amministratore).
/lang - Permette il cambio della lingua, sono supportati solo italian e inglese (Solo proprietario o un amministratore).
/rank - Motra le tre prime posizioni in classifica e i relativi punteggi.
/rank10 - Mostra i prim i dieci classificati ed i relativi punteggi, tutti i membri possono usare il comando ma sul bot Premium.
/myrank - Mostra la posizione della classifica a chi lo invoca.
/categories - Permette agli amministratori di scegliere le categorie dei quiz da mostrare (Solo bot Premium)
/showprice - Mostra i prezzi per attivare la versione Premiuom (Solo Il creatore puoi usare il comando) o qualsiasi utente direttamente dal bot.
/enableac - Esegue automaticamente il comando /hint ad intervalli compresi fra 60 e 360 minuti. Il comando verrà disattivato automaticamente alle 23:00 (Solo utenti Premium).
/disableac - Disabilita il l'autocast (Solo utenti Premium).`,
			'cannotExecuteQuizToday': `Non puoi eseguire altri quiz per oggi, riprova domani.`,
			'cannotExecuteQuizTodayStandard': `Non puoi eseguire altri quiz per oggi.\ngli account premium permettono l'esecuzione di tre quiz al giorno.\nPer ulteriori informazioni accedi al bot @QuizGenix_bot esegui il comando /showprice`,
		},
		'en': {
			'quizReset': 'Bravo Mr./Madam!!! You have completed the cycle of all the ministerial tests for the nautical license. Reload the /quiznautica command to start over from the beginning.',
			'aStarted': 'Autocast started',
			'aStopped': 'Autocast stopped',
			'noUsername': 'To play you need to set Username.',
			'autocastenabled': 'Autocast enabled every ',
			'autocastdisabled': 'Autocast disabled ',
			'quizalreadystarted': 'A quiz is already started and a new hist was run. Use /hint@QuizGenix_bot command to raise a new hint',
			'greating': 'Hello',
			'builtBy': `Bot created by <a href='${brandURL}'>${brandName}</a>`,
			'thankyouforInvocation': "Thank You to invoke me, this bot is in beta testing and can be used only by Creators, stay tuned we ar going to go online very soon.",
			'mustAdmin': 'Only an admin can use this command.',
			'errorMessage': "Error",
			'nobodyMessage': "No one",
			'pointWord': "points",
			'positionMessage': `Your rank is %pos° in the group %gname`,
			'configuredMessage': "Language set",
			'botAlreadyInitiated': "Bot already initialized, use the specific command to configure\nRun /help@QuizGenix_bot to check complete command list",
			'botInitiated': "Successfull initialization\nThis is the free version of bot, to activate full capabilities activate premium version",
			'responseOnlyToMessage': "Reply only to the message related to active question.\nThank You.",
			'notActiveQuiz': "This quiz is deactivated.",
			'closedQuizMessage': "This qujiz is ended.",
			'pausedQuizMessage': "This quiz is paused, you'ĺl respond when reactivated.",
			'tryAgainMessage': "Try again, don't give up",
			'cannotRespondMessage': "Cannot respond to this quiz.",
			'youGuess_message': "Great!!! %name you guessed it!\r\nThe solution to the quiz is\r\n",
			'noResponseMessage': 'No one found the correct answer.\r\nThe correct asnwer is!!!\r\n',
			'noQuizActive_message': 'A new quiz was run.',
			'noNewQuestions': "No further question in the database",
			'toUseStartMessage': "Before use the command need to initialize the bot with /start@QuizGenix_bot",
			'chooseLangMessage': "Choose the language",
			'chooseLangAndMoreMessage': "Choose the language\nWARNING: Runnig quiz will be reset",
			'chooseCategoryMessage': "Choose the categories for the quiz you want to show in group\nWARNING: Runnig quiz will be reset",
			'solveMessage': 'Quiz #%id\r\nTo give solution reply to this message.\r\n\r\n%question\r\n',
			'forPremiumUser': 'This command can be used only in Premium Bot version\nUse /showprice to check prices',
			'nothere': "Add to a group to play with me.",
			'goalInfo': "Sub goal of month_tag is subgoal_tag of goal_tag\r\n\r\nThank You for your interest.\r\nIf can please to help to reach the montly goal to maintain the server and develop\r\n\r\n Execute command /showprice and follow istruction to help to maintain the bot alive or donate if you can.\r\n\r\nThis command pretend to bne used inside group where you want I act, add me and have fun.",
			'noRank': "You are not ranked.",
			'paypal':
				`Actually the only supported payment mode is PayPal,
Please follow these steps
1. Proceed with payment using related left button.
2. In the payment comment put this code %uid
3. Please make the payment as "Send money to friend"
4. When the payments is completed click on 'Payed' button on the right of used link.
Premium version will be activated in 48 hour from payments
IMPORTANT: without adding the %uid code in PayPal comment and without confirm with button "Payed" on the right of used url the activation would take longer or not activated at all
For eventual issue or clarification can contact us by mail on ${contactMail}`,
			'payed': "Payed",
			'confirmed': `Thanks to confirm the payments.\nThe request will be take in charge as soon as possible.\nIf you forgot to write che code %uid please send it by mail at ${contactMail}`,
			'executeonbot': "This command have to be executed directly on bot @QuizGenix_bot",
			'helpDescr': `/quiz - Add a new letter to a quiz, if not started start a new one. (Only Owner or admin).
/hint - Add a new letter to a quiz, if not started start a new one. (Only Owner or admin).
/lang - Allow to change language, support only it and en (Only Owner or admin).
/rank - Show firt three positions with related points.
/rank10 - Show firt ten positions with related points, all member can use but in Premium bot.
/myrank - Using this comman each user can show his/her position.
/categories - This command allow admin to choose the quiz category to show (Only Premium bot).
/showprice - This command show the price for premium version (Only Creator can use) or any people but inside the bot.
/enableac - This command automatically cast the hint command. Can pass the number of minutes to set between 60 and 360. The command will be disabled after the 23:00 (Only Premium bot).
/disableac - This command disable autocast (Only Premium bot).`,
			'cannotExecuteQuizToday': `Cannot execute more quiz for today, try again tomorrow.`,
			'cannotExecuteQuizTodayStandard': `Cannot execute more quiz for today.\nPremium account allow execution of 3 quiz per day.\nFor additional informations, please access the bot @QuizGenix_bot and run the command /showprice`,

		}
	},
	get t() {
		return this.translate[this.iLang];
	},
	get lang() {
		return this.iLang;
	},
	set lang(lang) {
		this.iLang = lang;
	}
}
