// Punto de entrada. Solo carga los módulos que la página necesita.
import { $ } from "./utilities.js";
import { initServerMessages } from "./notifications.js";

initServerMessages();

const has = (selector) => Boolean($(selector));
const load = (selector, file, init) => { if (has(selector)) import(file).then((m) => m[init]()); };

load("#primary-nav, #search-toggle, [data-dropdown]", "./navigation.js", "initNavigation");
load("form[data-validate]", "./forms.js", "initForms");
load("form[data-confirm]", "./dialogs.js", "initConfirmForms");
load("[data-carousel]", "./carousel.js", "initCarousels");
load("form[data-clean-params], select[data-autosubmit]", "./search.js", "initSearch");
load("[data-live-region]", "./live-results.js", "initLiveResults");
load("[data-suggestions]", "./live-results.js", "initHeaderSuggest");
load("[data-like-url]", "./likes.js", "initLikes");
load("#comment-form", "./comments.js", "initComments");
load(".prose", "./reading.js", "initReading");
load("[data-share], [data-copy-link]", "./share.js", "initShare");
load("[data-shortcut]", "./shortcuts.js", "initShortcuts");
load("#admin-sidebar", "./admin.js", "initAdmin");
load("table[data-sortable], form[data-ajax-row]", "./admin-tables.js", "initAdminTables");
load("[data-slide-table]", "./slides.js", "initSlides");
load(".admin-form form[data-validate]", "./admin-forms.js", "initAdminForms");
