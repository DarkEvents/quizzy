export const PREMIUM_PRICE = "SELECT * FROM `pricing` WHERE 1";
export const SELECT_ALL_CATEGORY = `SELECT id, description
                               FROM category
                              WHERE lang = ?
															  AND type = 'answer'`; // exclude quiz's
export const SELECT_CONFIG = `SELECT lang, if(now() > c.subscription_end_date, 0, c.subscription) as subscription, subscription_end_date, categories, description as sub_descr, day_duration as sub_day, price as sub_price
                         FROM config c left outer join (SELECT *
                                                          FROM payments py join pricing p ON py.pricing_id_fk = p.id) qry ON c.ownerId = qry.telegram_id
                        WHERE chat_id= ?`;
export const SELECT_CONFIG_QUIZ = `SELECT lang,
																					if(now() > c.subscription_end_date,
																					0,
																					c.subscription) as subscription,
																					subscription_end_date,
																					18 as categories,
																					description as sub_descr,
																					day_duration as sub_day,
																					price as sub_price
                         FROM config c left outer join (SELECT *
                                                          FROM payments py join pricing p ON py.pricing_id_fk = p.id) qry ON c.ownerId = qry.telegram_id
                        WHERE chat_id= ?`;
export const INSERT_INTO_USER = "INSERT INTO user (session_id_fk, usertelegramid, username, first_name, last_name, points) VALUES(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE points=1 ";

export const SELECT_QUIZ_TOREPLY = "SELECT q.id, q.question, q.answer, s.status, s.mask, IFNULL(q.img, c.img) AS img, s.id as sid, c.type FROM `quiz` q join `session` s ON q.id = s.quiz_id_fk join category c ON q.category_id_fk = c.id where s.status = 'run' and q.id = ? and s.chat_id = ? AND q.lang = ? AND c.lang = q.lang";
export const SELECT_QUIZ_RESTART = "SELECT q.id, q.question, q.answer, s.status, s.mask, IFNULL(q.img, c.img) AS img             , c.type FROM `quiz` q join `session` s ON q.id = s.quiz_id_fk join category c ON q.category_id_fk = c.id where s.status in ('run', 'pause')  and s.chat_id = ? AND q.lang = ? AND c.lang = q.lang";
export const SELECT_FROM_SESSION = "SELECT * FROM session WHERE chat_id=? and status <> 'end'";
export const RESET_QUIZ_SESSION = "DELETE FROM session WHERE mask='?'";
export const SELECT_QUIZ_ANSWERS = "SELECT COUNT(*) AS count FROM quiz_answers WHERE quiz_id_fk=?";

export const SELECT_RANK = `SELECT u.usertelegramid, u.username, u.first_name, count(*) as points, (dense_rank() OVER( order by count(*) desc)) as rango
                                FROM user u JOIN session s ON u.session_id_fk  = s.id
                               WHERE s.chat_id = ?
                            GROUP BY u.usertelegramid, u.username, u.first_name ORDER by count(*) desc `;
export const UPDATE_MASK = "UPDATE session set mask = ? WHERE chat_id = ? and quiz_id_fk = ?";
export const UPDATE_SESSION_STATUS = "UPDATE session set status = 'end' WHERE chat_id = ?";
export const UPDATE_LANG = `UPDATE config
                        SET lang = ?
                      WHERE chat_id = ?`;

export const UPDATE_CATEGORY = `UPDATE config
                            SET categories = ?
                          WHERE chat_id = ?`;
export const AUTOCAST = `UPDATE config
                     SET autocast = ?
                   WHERE chat_id = ?`;
export const DELETE_SESSION = `DELETE
                          FROM  session
                         WHERE chat_id = ?
                           AND status <> 'end'`;

export const SELECT_ANSWER_INIT_FILT = `SELECT q.id, q.question, q.answer, IFNULL(q.img, c.img) AS img, c.type
																				FROM quiz q left outer join session s ON (q.id = s.quiz_id_fk and chat_id = ?)
																																join category c ON q.category_id_fk = c.id AND q.lang = c.lang and c.id in (?)
																				WHERE (s.status <> 'end'
																							OR s.status is null)
																					AND q.lang = ?
																					AND c.type = 'answer'
																		ORDER BY RAND()
																				LIMIT 1`;
export const SELECT_ANSWER_INIT_ALL = `SELECT q.id, q.question, q.answer, IFNULL(q.img, c.img) AS img, c.type
																			FROM quiz q left outer join session s ON (q.id = s.quiz_id_fk and chat_id = ?)
																													join category c ON q.category_id_fk = c.id
																			WHERE (s.status <> 'end'
																							OR s.status is null)
																				AND q.lang = ?
																				AND c.type = 'answer'
																			ORDER BY RAND()
																			LIMIT 1`;

export const SELECT_QUIZ_INIT = `SELECT q.id, q.question, q.answer, IFNULL(q.img, c.img) AS img, c.type
								   FROM quiz q left outer join session s ON (q.id = s.quiz_id_fk and s.chat_id = ?)
									 					  join category c ON q.category_id_fk = c.id
								  WHERE (s.status <> 'end' OR s.status is null) AND q.lang = 'it'
								    AND c.type = 'quiz'
						       ORDER BY RAND()
								  LIMIT 1`;
export const SELECT_QUIZ_NUMBER = `SELECT distinct q.id, q.question, q.answer, IFNULL(q.img, c.img) AS img, c.type
								 	 FROM quiz q left outer join session s ON (q.id = s.quiz_id_fk and s.chat_id = ?)
															join category c ON q.category_id_fk = c.id
								    WHERE q.lang = 'it'
									  AND c.type = 'quiz'
									  AND q.id = ?`;
export const SELECT_VELA_INIT = `SELECT q.id, q.question, q.answer, IFNULL(q.img, c.img) AS img, c.type
								   FROM quiz q left outer join session s ON (q.id = s.quiz_id_fk and s.chat_id = ?)
									 					  join category c ON q.category_id_fk = c.id
								  WHERE (s.status <> 'end' OR s.status is null) AND q.lang = 'it'
								    AND c.type = 'vela'
						       ORDER BY RAND()
								  LIMIT 1`;
export const SELECT_VELA_NUMBER = `SELECT distinct q.id, q.question, q.answer, IFNULL(q.img, c.img) AS img, c.type
								 	 FROM quiz q left outer join session s ON (q.id = s.quiz_id_fk and s.chat_id = ?)
															join category c ON q.category_id_fk = c.id
								    WHERE q.lang = 'it'
									  AND c.type = 'vela'
									  AND q.id = ?`;

export const INSERT_INTO_SESSION = "INSERT INTO session (chat_id, group_title, user_name, user_role, status, quiz_id_fk, mask) VALUES (?,?,?,?,?,?,?)";
export const SELECT_FOUND_LANG = "SELECT count(*) as found, lang FROM `config` WHERE chat_id = ? group by lang";
export const INSERT_PAYED = `INSERT
                        INTO payments (telegram_id, username, first_name, pricing_id_fk, active)
                      VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY
                      UPDATE username = ?, first_name = ?, pricing_id_fk = ?;`;
export const UPDATE_SUBSCRIPTION = `UPDATE config
					  SET subscription = 0,
						  subscription_end_date = ?
					WHERE ownerid = ?`;
export const SELECT_QUIZ_COUNTER = `SELECT canstartquiz(?,?) as isEnabled FROM dual`;

export const SELECT_INFO = "   SELECT `goalsettings`. `goal` AS goal, IFNULL(SUM(`ledger`.`share`), 0) AS share, IFNULL(CONCAT(YEAR(ledger.date), '-', LPAD(MONTH(ledger.date), 2, 0)),CONCAT(YEAR(NOW()), '-', LPAD(MONTH(NOW()), 2, 0))) AS YMonth  " +
	"     FROM `goalsettings` LEFT JOIN `ledger` ON 1 = 1 AND  CONCAT(YEAR(`ledger`.`date`),'-',LPAD(MONTH(`ledger`.`date`),2,0)) = CONCAT(YEAR(now()),'-',LPAD(MONTH(now()),2,0))      " +
	" GROUP BY CONCAT(YEAR(`ledger`.`date`),'-',LPAD(MONTH(`ledger`.`date`),2,0)), `goalsettings`.`goal`                                                                                ";

export const SELECT_QUIZ_STATS = 	"   SELECT SUM(CASE WHEN `quiz_answers`.right_wrong = true THEN 1 ELSE 0 END) as correct, "+
																	"          SUM(CASE WHEN `quiz_answers`.right_wrong = false THEN 1 ELSE 0 END) as wrong, 	"+
																	"			MAX(CASE WHEN `quiz_answers`.usertelegramid = ? THEN 1 ELSE 0 END) as hasVoted, "+
																	"			JSON_UNQUOTE(JSON_EXTRACT(`quiz`.`answer`, '$[3]')) AS correctAnsPosition, "+
																	"			MAX(`quiz`.`answer`) answer "+
																	"     FROM `quiz_answers` JOIN `quiz` ON `quiz`.id = `quiz_answers`.quiz_id_fk AND `quiz`.lang = 'it' "+
																	"		 WHERE `quiz_answers`.`quiz_id_fk`= ?																									"+
																	" GROUP BY `quiz_answers`.`quiz_id_fk` 																										";
// still not used
export const SELECT_CORRECT =	" SELECT JSON_UNQUOTE(JSON_EXTRACT(`quiz`.`answer`, CONCAT('$[', JSON_UNQUOTE(JSON_EXTRACT(`quiz`.`answer`, '$[3]'))-1, ']'))) AS risposta_giusta, "+
								" 		 JSON_EXTRACT(`quiz`.`answer`, '$[3]') "+
								"   FROM guessmyquestion.quiz "+
								"  WHERE guessmyquestion.quiz.id >= 2000 ";

export const CREATE_CONFIG = `INSERT config (chat_id, group_link, ownerid, lang) Values (?, ?, ?, ?)`
export const UPDATE_QUIZ_RESULT = `INSERT quiz_answers (quiz_id_fk, usertelegramid, username, first_name, last_name, right_wrong) Values (?, ?, ?, ?, ?, ?)`
// Second Release
//const SELECT_QUIZ_INIT_FILT = `SELECT t.id, t.question, t.answer, IFNULL(t.img, c.img) AS img
//                                 FROM quiz AS t JOIN (SELECT ROUND(RAND() * (SELECT MAX(q.id)
//                                                         FROM quiz q left outer join session s ON (q.id = s.quiz_id_fk and chat_id = ?)
//                                                                                 join category c ON q.category_id_fk = c.id AND q.lang = c.lang and c.id in (?)
//                                                         WHERE (s.status <> 'end'
//                                                                 OR s.status is null)
//                                                         AND q.lang = ?)) AS id
//                                                         ) AS x ON t.id   >= x.id
//                                                 JOIN category c ON t.category_id_fk = c.id AND t.lang = c.lang
//                                WHERE t.lang = ?
//                                LIMIT 1`;
// const SELECT_QUIZ_INIT_ALL = `SELECT t.id, t.question, t.answer, IFNULL(t.img, c.img) AS img
//                                FROM quiz AS t JOIN (SELECT ROUND(RAND() * (SELECT MAX(q.id)
//                                                                              FROM quiz q left outer join session s ON (q.id = s.quiz_id_fk and chat_id = ?)
//                                                                                                     join category c ON q.category_id_fk = c.id
//                                                                             WHERE (s.status <> 'end'
//                                                                                      OR s.status is null)
//                                                                              AND q.lang = ?)) AS id
//                                                ) AS x ON t.id   >= x.id
//                                               JOIN category c ON t.category_id_fk = c.id AND t.lang = c.lang
//                               WHERE t.lang = ?
//                               LIMIT 1`;
// First release
// const SELECT_QUIZ_INIT_ALL = `SELECT q.id, q.question, q.answer, IFNULL(q.img, c.img) AS img
//                             FROM quiz q left outer join session s ON (q.id = s.quiz_id_fk and chat_id = ?)
//                                                    join category c ON q.category_id_fk = c.id
//                            WHERE (s.status <> 'end'
//                               OR s.status is null)
//                              AND q.lang = ?
//                         ORDER BY q.id
//                             LIMIT 1 `;
// const SELECT_QUIZ_INIT_FILT = `SELECT q.id, q.question, q.answer, IFNULL(q.img, c.img) AS img
//                             FROM quiz q left outer join session s ON (q.id = s.quiz_id_fk and chat_id = ?)
//                                                    join category c ON q.category_id_fk = c.id AND q.lang = c.lang and c.id in (?)
//                            WHERE (s.status <> 'end'
//                               OR s.status is null)
//                              AND q.lang = ?
//                         ORDER BY q.id
//                             LIMIT 1 `;
