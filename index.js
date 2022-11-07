/* Парсер статей рубрики "Код" портала Skillbox Media (https://skillbox.ru/media/code/) */
   // Записывает заголовки и ссылки на статьи в html-файл
   // Написан на NodeJS с использованием модулей axios и jsdom
 
const axios = require('axios'); // Подключаем к NodeJS модуль axios для скачивания страницы
const fs = require('fs'); // Подключение встроенного в NodeJS модуля fs для работы с файловой системой
const jsdom = require("jsdom"); // Подключение модуля jsdom для работы с DOM-деревом (1)
const { JSDOM } = jsdom; // Подключение модуля jsdom для работы с DOM-деревом (2)
 
const pagesNumber = 101; // Количество страниц со статьями на сайте журнала на текущий день. На каждой странице по 7 статей
var page = 1; // Номер первой страницы для старта перехода по страницам с помощью пагинатора
var parsingTimeout = 0; // Стартовое значение задержки следующего запроса (увеличивается с каждым запросом, чтобы не отправлять их слишком часто)
 
// Определяем стартовые параметры запроса (меняться будет только номер страницы)
var params = new URLSearchParams();
   params.append('params[SECTION_ID]', '10');
   params.append('params[CODE_EXCLUDE]', 'news');
   params.append('params[FIRST_IS_FULL]', 'Y');
   params.append('params[COUNT]', '7');
   params.append('params[PAGE_NUM]', '1');
   params.append('params[FIELDS][]', 'PROPERTY_FAKE_COUNTER');
   params.append('params[CACHE_TYPE]', 'A');
   params.append('params[COMPONENT_TEMPLATE]', 'articles');
 
function paginator() {
   function getArticles() {
      console.log('Запрос статей со страницы ' + params.get('params[PAGE_NUM]')); // Уведомление о номере текущей страницы
      // Запрос к странице сайта
      axios.post('https://skillbox.ru/local/ajax/getArticlesIndex.php?', params)
         .then(response => {
            var currentPage = response.data; // Запись полученного результата
            var jsonToHtml = currentPage.html; // Получаем из JSON-ответа только html-код
            const dom = new JSDOM(jsonToHtml); // Инициализация библиотеки jsdom для разбора полученных html-данных как в браузере
            // Парсинг закреплённой статьи
               var pinnedHeaderSpaces = dom.window.document.getElementsByClassName('important-block__main-title')[0].innerHTML; // Получение заголовка закреплённой статьи с лишними пробелами
               var pinnedHeader = pinnedHeaderSpaces.trim(); // Заголовок закреплённой статьи с удалёнными лишними пробелами
               var pinnedLink = dom.window.document.getElementsByClassName('important-block__main-title')[0].getAttribute('href'); // Получение относительной ссылки на закреплённую статью
               var pinnedArticle = '<a href="https://skillbox.ru' + pinnedLink + '">' + pinnedHeader + '</a><br>'+ '\n'; // Итоговая ссылка с заголовком закреплённой статьи
               console.log('На странице найдена закреплённая статья: ' + pinnedArticle);
               // Запись закреплённой статьи в файл
               fs.appendFileSync('ПУТЬ/articles.html', pinnedArticle, (err) => {
                  if (err) throw err;
               });
            
            // Парсинг остальных 6-ти статей на странице
            var articlesNumber = dom.window.document.getElementsByClassName('media-catalog__tile-title').length; // Определение количества ссылок на странице, потому что на последней странице их меньше. Эта цифра понадобится в цикле ниже
            for (var art = 0; art < articlesNumber; art++) {
               var articleHeaderSpaces = dom.window.document.getElementsByClassName('media-catalog__tile-title')[art].innerHTML; // Получение заголовка статьи с лишними пробелами
               var articleHeader = articleHeaderSpaces.trim(); // Заголовок статьи с удалёнными лишними пробелами
               var articleLink = dom.window.document.getElementsByClassName('media-catalog__tile')[art].getElementsByClassName('media-catalog__tile-title')[0].parentElement.getAttribute('href'); // Получение относительной ссылки на статью
               var article = '<a href="https://skillbox.ru' + articleLink + '">' + articleHeader + '</a><br>'+ '\n'; // Итоговая ссылка с заголовком статьи
               console.log('На странице найдена статья: ' + article);
               // Запись статьи в файл
               fs.appendFileSync('ПУТЬ/articles.html', article, (err) => {
                  if (err) throw err;
               });
            };
            if (page > pagesNumber) {
               console.log('Парсинг завершён.'); // Уведомление об окончании работы парсера
            };
         });
      page++; // Увеличение номера страницы для сбора данных, чтобы следующий запрос был на более старую страницу
      params.set('params[PAGE_NUM]', page);
      return;
   };
   for (var i = page; i <= pagesNumber; i++) {   
         var getTimer = setTimeout(getArticles, parsingTimeout); // Запуск сбора статей на конкретной странице с задержкой
         parsingTimeout += 10000; // Определение времени, через которое начнётся повторный запрос (к следующей по счёту странице)
   };
   return;
};
paginator(); // Запуск перехода по страницам и сбора статей
