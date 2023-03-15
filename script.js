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
							"pagination":{
								"page_size":"Page Size", //label for the page size select element
								"page_title":"Show Page",//tooltip text for the numeric page button, appears in front of the page number (eg. "Show Page" will result in a tool tip of "Show Page 1" on the page 1 button)
								"first":"First", //text for the first page button
								"first_title":"First Page", //tooltip text for the first page button
								"last":"Last",
								"last_title":"Last Page",
								"prev":"Prev",
								"prev_title":"Prev Page",
								"next":"Next",
								"next_title":"Next Page",
								"all":"All",
								"counter":{
									"showing": "Showing",
									"of": "of",
									"rows": "rows",
									"pages": "pages",
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
						{title: translations.titleStatus, field:"status", width:120},
						{title: translations.titleDateIni, field:"data_inizio", sorter:"date"},
						{title: translations.titleDateEnd, field:"data_fine", sorter:"date"},
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

	const status = document.querySelector('div[tabulator-field="status"]').children[0]
	status.innerText = translations.titleStatus;
	const initialDate = document.querySelector('div[tabulator-field="data_inizio"]').children[0]
	initialDate.innerText = translations.titleDateIni;
	const finalDate = document.querySelector('div[tabulator-field="data_fine"]').children[0]
	finalDate.innerText = translations.titleDateEnd;
	console.log(table.getLocale())
  }
