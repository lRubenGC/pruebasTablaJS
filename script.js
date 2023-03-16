let data = [];
let table;
let translations;

window.onload = () => {
	// Idioma al lanzar la web
	let fileRoute = './idiomas/es.json';
	let xhr = new XMLHttpRequest();
	xhr.open('GET', fileRoute, true);
	xhr.onload = function () {
		if (xhr.readyState === xhr.DONE) {
			if (xhr.status === 200) {
				translations = JSON.parse(xhr.responseText);
			}
		}
	};
	xhr.send(null);

	// Evento que salta cuando se quiere cambiar el idioma
	document.getElementById('language-select').addEventListener('change', function() {
		let language = this.value;

		// Cambiar idioma tabla
		table.setLocale(language);

		// Cambiar idioma DOM
		let fileRoute = `./idiomas/${language}.json`;
		let xhr = new XMLHttpRequest();
		xhr.open('GET', fileRoute, true);
		xhr.onload = function () {
			if (xhr.readyState === xhr.DONE) {
				if (xhr.status === 200) {
					translations = JSON.parse(xhr.responseText);
					updateUI(translations);
				}
			}
		};
		xhr.send(null);
	});
	// Activar botones de importación
    document.getElementById("import-button").addEventListener("click", importClipboard);
    document.getElementById("fileInput").addEventListener("change", importXLSX);
	document.getElementById("import-excel-file").addEventListener("click", () => {
		document.getElementById("import-excel").click();
	})

	// Se crea la tabla con su configuración
	let intervalId = setInterval(() => {
		if (translations !== undefined) {
			clearInterval(intervalId);
			setTimeout(() => {
				table = new Tabulator("#tabulator-table", {
					data,
					layout:"fitColumns",
					addRowPos:"top",
					history:true,             //allow undo and redo actions on the table
					pagination:"local",       //paginate the data
					paginationSize:5,
					paginationCounter:"rows", //display count of paginated rows in footer
					movableColumns:true,
					columnDefaults:{
						tooltip:true,         //show tool tips on cells
					},
					locale: true,
					langs: {
						"default": {
							"columns": {
								"status": "Estado",
								"data_inizio": "Fecha inicial",
								"data_fine": "Fecha final"
							},
							"pagination":{
								"page_size":"Tamaño pág.",
								"page_title":"Mostrar pág.",
								"first":"Primera",
								"first_title":"Primera pág.",
								"last":"Última",
								"last_title":"Última pág.",
								"prev":"Anterior",
								"prev_title":"Pág. Anterior",
								"next":"Siguiente",
								"next_title":"Siguiente pág.",
								"all":"Todas",
								"counter":{
									"showing": "Mostrando",
									"of": "de",
									"rows": "filas",
									"pages": "páginas",
								}
							}
						},
						"en": {
							"columns": {
								"status": "Status",
								"data_inizio": "Initial date",
								"data_fine": "Final date"
							},
							"pagination":{
								"page_size":"Page size",
								"page_title":"Show page",
								"first":"First",
								"first_title":"First page",
								"last":"Last",
								"last_title":"Last page",
								"prev":"Prev",
								"prev_title":"Prev page",
								"next":"Next",
								"next_title":"Next page",
								"all":"All",
								"counter":{
									"showing": "Showing",
									"of": "of",
									"rows": "rows",
									"pages": "pages",
								}
							}
						},
						"it": {
							"columns": {
								"status": "Stato",
								"data_inizio": "Data inizio",
								"data_fine": "Data fine"
							},
							"pagination":{
								"page_size":"Dimensioni pag",
								"page_title":"Mostrar pag.",
								"first":"Prima",
								"first_title":"Primera pag.",
								"last":"Scorsa",
								"last_title":"Ultima pag.",
								"prev":"Prec.",
								"prev_title":"Pag. precedente",
								"next":"Prossima",
								"next_title":"Pag. successiva",
								"all":"Tutta",
								"counter":{
									"showing": "Mostrando",
									"of": "di",
									"rows": "righe",
									"pages": "pagine",
								}
							}
						}
					},
					columns:[
						{title: "Num", field:"num"},
						{title: "Target", field:"target"},
						{title: "Remap", field:"remap"},
						{title: "Nome", field:"nome", width: 300},
						{title: "SurveyId", field:"surveyid", width:120},
						{title: "Estado", field:"status", width:120},
						{title: "Fecha inicial", field:"data_inizio", sorter:"date"},
						{title: "Fecha final", field:"data_fine", sorter:"date"},
						{title: "var1", field:"var1"},
						{title: "cod1", field:"cod1"},
						{title: "var2", field:"var2"},
						{title: "cod2", field:"cod2"}
					],
				});
		
			}, 0);
		}
	})

}

importClipboard = async() => {
	// Se vacia el campo de errores
	document.getElementById("error-formato").innerHTML = "";
	document.getElementById("errores").innerHTML = "";

	// Se consigue data del portapapeles
    try {
        clipboard = await navigator.clipboard.readText();
    } catch (err) {
        console.log(err);
    }
    const rows = clipboard.split("\n");

	// VALIDACIONES
	const dateFormat = /^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/i;
	let emptyRows = 0;
    for (let i = 0; i < rows.length; i++) {
		const row = rows[i].split("\t");
		
		// Que todas las filas tengan 12 campos
        if (row.length !== 12) {
			const error = `<div id="label-error-formato" class="alert alert-danger" role="alert"><span id="invalid-format">${translations.invalidFormat}</span></div>`;
			document.getElementById("error-formato").innerHTML += error;
            return;
        }

		// Si SurveyId viene vacío no se añade fila
		if (!row[4]) {
			emptyRows++;
            continue;
		}

		// Formato de fecha dd/mm/yyyy
		if (!row[6].match(dateFormat) || !row[7].match(dateFormat)) {
			const error = `<div class="alert alert-danger label-error" role="alert">${row[0]}<span class="invalid-date">${translations.invalidDate}</span></div>`;
			document.getElementById("errores").innerHTML += error;
            continue;
		}

		// Fecha de inicio menor a fecha final
		const initDate = new Date(row[6]).getTime();
		const finalDate = new Date(row[7]).getTime();
		if (initDate > finalDate) {
			const error = `<div class="alert alert-danger label-error" role="alert">${row[0]}<span class="ilogical-date">${translations.ilogicalDate}</span></div>`;
			document.getElementById("errores").innerHTML += error;
            continue;
		}

		// Añadir fila a la tabla
        object = {
			"num": row[0],
			"target": row[1],
			"remap": row[2],
			"nome": row[3],
			"surveyid": row[4],
			"status": row[5],
			"data_inizio": row[6],
			"data_fine": row[7],
			"var1": row[8],
			"cod1": row[9],
			"var2": row[10],
			"cod2": row[11],
		}

		let currentData = table.getData();
		currentData.push(object);
		table.setData(currentData);
		
		// Activar botón Exportar a CSV
		document.getElementById("export-to-csv").addEventListener("click", exportTable);
		// Activar botón Send to API
		document.getElementById("send-to-api").addEventListener("click", sendToAPI);
    }

	// Añadir alerta de error de filas vacías si la hay
	if (emptyRows > 0) {
		const error = `<div class="alert alert-danger label-error" role="alert">${emptyRows} <span class="no-data-survey">${translations.noDataSurvey}</span></div>`;
		document.getElementById("errores").innerHTML += error;
	}

}
// NO FUNCIONA TODAVIA
importXLSX = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
        const data = new Uint8Array(ev.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        fileToTable(worksheet);
    }
    reader.readAsArrayBuffer(file);
}
// NO FUNCIONA TODAVIA
fileToTable = (data) => {
    const obj = Object.keys(data)[8];
    console.log(obj);
    console.log(data);
}

sendToAPI = () => {
	// log en consola del id de cada fila
	const rows = table.getData();

    rows.forEach(row => {
        console.log(`Registrando en API: ${row.surveyid}`);
    })

}

exportTable = () => {
	// Exportación de la tabla a archivo CSV
    let csv = [];
    const rows = table.getData();
	
    for (let i = 0; i < rows.length; i++) {
		const obj = Object.values(rows[i]);        
        csv.push(obj.join(","));
    }

	const csvFile = new Blob([csv.join("\n")], {type: "text/csv"});
    
    let dw = document.createElement("a");
    dw.download = `data_table.csv`;
    dw.href = window.URL.createObjectURL(csvFile);
    dw.style.display = "none";
    document.body.appendChild(dw);
    dw.click();
    document.body.removeChild(dw);
}

updateUI = (translations) => {
	document.getElementById('header-table').textContent = translations.headerTitle;
	document.getElementById('header-language').textContent = translations.headerLanguage;
	document.getElementById('copy-clipboard').textContent = translations.copyClipboard;
	document.getElementById('import-button').textContent = translations.importButton;
	document.getElementById('import-excel').textContent = translations.importExcel;
	document.getElementById('import-excel-file').textContent = translations.importButtonExcel;
	document.getElementById('export-to-csv').textContent = translations.exportCSV;
	document.getElementById('send-to-api').textContent = translations.sendToApi;

	const invalidFormat = document.getElementById('invalid-format');
	if (invalidFormat) {
		invalidFormat.textContent = translations.invalidFormat;
	}
	
	const invalidDate = document.getElementsByClassName('invalid-date');
	if (invalidDate) {
		for (let i = 0; i < invalidDate.length; i++) {
			invalidDate[i].textContent = translations.invalidDate;
		}
	};
	
	const ilogicalDate = document.getElementsByClassName('ilogical-date');
	if (ilogicalDate) {
		for (let i = 0; i < invalidDate.length; i++) {
			if (ilogicalDate[i]) {
				ilogicalDate[i].textContent = translations.ilogicalDate;
			}
		}
	};
	
	const noDataSurvey = document.getElementsByClassName('no-data-survey');
	if (noDataSurvey) {
		for (let i = 0; i < invalidDate.length; i++) {
			if (noDataSurvey[i]) {
				noDataSurvey[i].textContent = translations.noDataSurvey;
			}
		}
	};

	const headerHelper = document.getElementById("header-helper");
	headerHelper.textContent = translations.headerHelper;

}
