//Модули:
const {VK, KEYBOARD} = require('vk-io');
const vk = new VK();
const { updates } = vk;
const fs = require('fs');
const { parse } = require('url');
const ShopItems = require("./ShopItems1.json");

//Обработчик сообщений:
vk.updates.use(async (mes, next) =>
{
	if (mes.type == 'message' && (mes.isOutbox || mes.senderId < 0)) return;
	if(mes.senderId ===  undefined || mes.senderType !== 'user') return;
	try
    {
		await next();
    }
    catch (e)
    {
		console.log(e);
    }
});

var Gods = [559144282];	//Боги
var randomEnable = true;
var maxRandomsPerRequest = 99999999;	//Максимальное число бросков рандома для игрока

function Random(min, max)
{
	return min == max ? min : Math.round(min - 0.5 + Math.random() * (max - min + 1));
}

function isGod(id) {
	return Gods.includes(id);
}

function saveConfigs() {
	var conf = {
		maxRandomsPerRequest: maxRandomsPerRequest,
		randomEnable: randomEnable
    }
	fs.writeFileSync('.configs.json', JSON.stringify(conf, null, "\t"));
}

function loadConfigs() {
	var file = JSON.parse(fs.readFileSync('.configs.json'));
	maxRandomsPerRequest = file.maxRandomsPerRequest;
	randomEnable = file.randomEnable;
}

function SaveShop() {
	fs.writeFileSync("./ShopItems1.json", JSON.stringify(ShopItems, null, "\t"));
}

vk.updates.hear(/^!укл (\d+)(?: (\d+))?$/i, async (message) =>
{
	let lv = Number(message.$match[1]), lovk = message.$match[2], stat = 0;
	if (lovk === undefined)
		lovk = 0;
	else
		lovk = Math.min(25, Number(lovk));
	for (let i = 1; i <= lv; i++)
		{
			stat += 15 * (1 + 0.2 * i) * (1-(lovk*2)*0.01);
		}
		message.send(Math.floor(stat));
});

vk.updates.hear(/^!(?:(хелп)|(help))$/i, async (message) =>
{
	message.send(`Список команд:
!р [a-b] [количество] [c-d] [+] - рандом.
[a и b] - границы диапазона рандома,
[количество] - количество рандомов(необязательно),
[c и d] - границы диапазона рандома для определения успешный ли он(необязательно),
[+] - если поставить в конце, будут выведены результаты рандомов при заданном диапазоне успеха(необязательно).

!Опыт [a] [b] [c] - подсчёт опыта по формуле,
[a] - уровень игрока,
[b] - уровень убитого,
[c] - количество убитых(опционально).

!укл [a] [b] - подсчет стоимости гарантированного уклонения от прямой атаки по формуле
[a] - Уровень игрока
[b] - Значение ловкости игрока (в sp)

Для магазина:
+Предмет [название]
[описание предмета] - добавление предмета
-Предмет [название] - удаление предмета
!Магазин - отображение доступных товаров
!Предмет [название] - описание определённого предмета`);
});

vk.updates.hear(/^!(?:(?:Р)|(?:R)) (?:(\d+)-(\d+))(?: (\d+))?(?: (\d+)-(\d+)(?: (\+)?)?)?$/i, async (message) =>
{
	//1, 2 - диапазон рандома, 3 - количество, 4 и 5 - диапазон успеха, 6 - показать или скрыть вывод результата
	if (!randomEnable) return;
	if (message.$match[3] == undefined) {
		message.send(Random(Number(message.$match[1]), Number(message.$match[2])));
	}
	else
	{
		var k = Number(message.$match[3]), counter = 0, fin = "";
		if (k > maxRandomsPerRequest) return;
		for (var i = 0; i < k; i++)
		{
			if (fin.length > 4050)
			{
				message.send("Не удаётся отправить настолько большое сообщение");
				return;
            }
			let tmp = Random(Number(message.$match[1]), Number(message.$match[2]));
			if (message.$match[6] == '+' || message.$match[4] == undefined)
				fin += tmp + ' ';
			if (tmp <= message.$match[5] && tmp >= message.$match[4])
				counter++;
		}
			message.send(`${message.$match[6] == '+' || message.$match[4] == undefined ? `Выпавшие числа: ${fin}.` : ""}\n${message.$match[4] != undefined ? `Количество успешных исходов: ${counter}` : ""}`);
	}
});

vk.updates.hear(/^!(?:(?:Опыт)|(?:Exp)) (\d{1,4}) (\d{1,4})(?: (\d+))?$/i, async (message) =>
{
	//1 - уровень игрока, 2 - уровень моба, 3 - количество мобов
	if (Number(message.$match[1]) < 1 || Number(message.$match[2]) < 1)
	{
		message.send("Уровень игрока и моба не может быть нулевым");
		return;
	}
	if (Math.abs(Number(message.$match[1]) - Number(message.$match[2])) > 30)
	{
		message.send("Не безопасно подсчитывать опыт с такой высокой разницей в уровнях. Сделайте это вручную.");
		return;
    }
	var plv = Number(message.$match[1]), mlv = Number(message.$match[2]), k;
	if (message.$match[3] != undefined)
		k = Number(message.$match[3]);
	else
		k = 1;
	var fin = 0;
	for (var i = 0; i < k; i++)
		fin += Math.ceil((mlv * 1.5) + plv * Math.pow(2, mlv - plv));
	message.send(fin);
});

//Админские команды:
vk.updates.hear(/^!рандом макс броски (\d+)$/i, async (message) => {
	if (!isGod(message.senderId)) return;
	maxRandomsPerRequest = Number(message.$match[1]);
	message.send("Теперь лимит на число бросков за раз = " + maxRandomsPerRequest);
});

vk.updates.hear(/^!рандом (?:(?:вкл)|(?:выкл))$/i, async (message) => {
	if (!isGod(message.senderId)) return;
	randomEnable = !randomEnable;
	message.send("Рандом теперь " + (randomEnable ? "включён": "выключен"));
});

vk.updates.hear(/^!сохр$/i, async (message) => {
	if (!isGod(message.senderId)) return;
	saveConfigs();
	message.send("Настройки сохранены");
});

vk.updates.hear(/^!загр$/i, async (message) => {
	if (!isGod(message.senderId)) return;
	fs.exists('.configs.json', (e) => {
		if (!e) {
			message.send("Не найден файл с сохранёнными настройками");
			return;
		}
		else {
			loadConfigs();
			message.send("Настройки загружены");
        }
	});
});

//Продавщица:


vk.updates.hear(/^\+Предмет (.+)\n(.+)$/im, async (message) => {
	if ([ShopItems.Owner, 559144282, 334913416].includes(message.senderId)) {
		ShopItems.Items[message.$match[1].trim().toLowerCase()] = message.text.replace(/^(.+)\n/i, '');
		SaveShop();
		message.send(`Предмет \"${message.$match[1]}\" добавлен в магазин`);
	}
});

vk.updates.hear(/^-Предмет (.+)$/i, async (message) => {
	if ([ShopItems.Owner, 559144282, 334913416].includes(message.senderId)) {
		delete ShopItems.Items[message.$match[1].trim()];
		SaveShop();
		message.send(`Предмет ${message.$match[1]} убран из магазина`);
	}
});

vk.updates.hear(/^!Магазин$/i, async (message) => {
	if (Object.keys(ShopItems.Items).length == 0) {
		let phrases = ["Кто-то всё спиздил из магазина!", "В настоящее время магазин пуст...", "А нет тут ничего", "Магазин закрыт"];
		message.send(phrases[Random(0, phrases.length - 1)]);
		return;
	}
	let FinalMessage = "Ассортимент магазина:";
	for (let item of Object.keys(ShopItems.Items)) {
		FinalMessage += '\n' + item;
	}
	message.send(FinalMessage);
});

vk.updates.hear(/^!Владелец магазина \[id(\d+)\|(.*)\]$/i, async (message) => {
	if ([559144282, 334913416].includes(message.senderId)) {
		if (ShopItems.Owner == Number(message.$match[1]))
			ShopItems.Owner = 0;
		else {
			ShopItems.Owner = Number(message.$match[1]);
			message.send(`${message.$match[2]} теперь владелец магазина`);
		}
		SaveShop();
	}
});

vk.updates.hear(/^!Предмет (.+)$/i, async (message) => {
	if (ShopItems.Items[message.$match[1]] == undefined)
		message.send("Такого предмета нет в магазине");
	else
		message.send(`[${message.$match[1]}]\n${ShopItems.Items[message.$match[1]]}`);
});

vk.updates.hear(/^!Очистить магазин$/im, async (message) => {
	if ([ShopItems.Owner, 559144282, 334913416].includes(message.senderId)) {
		let phrases = ["Магазин очищен", "* звук взрыва *", "РАЗДАЧА НА СПАВНЕ", "Все вещи были отданы бездомным олигархам", "Спасибо за шмот"]
		ShopItems.Items = {};
		SaveShop();
		message.send(phrases[Random(0, phrases.length - 1)]);
	}
});

//Авторизация бота.
async function polling()
{
	vk.setOptions({ 
		token: 'vk1.a.v2VmIZxMR_LRFusJi6tu-yBs7wAEHJPkFxqX4KJ5CExWqcnf03RRCV7oFZi1T3YzfJKLST5-T12PYg8x3JIn4qX5XTQUrdpJRbIEl3NIfhmrUHOtC2CrQ2kFBg5KdAUYBzT2QN-cYpU1m3vxuRp0PQ3FGp7GHDXSf_qtm3qIam7Ry9TNgm8IoOxLjXhWiTPS',
		apiMode: 'parallel',
		pollingGroupId: 216267800 //Айди
	});
	console.log('Запуск...');
	await vk.updates.startPolling();
	console.log("Соединение установлено");
}
polling().catch(console.error);