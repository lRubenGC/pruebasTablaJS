let data = [];
let table;

window.onload = () => {
    document.getElementById("importButton").addEventListener("click", importClipboard);
    document.getElementById("fileInput").addEventListener("change", importXLSX);
    document.getElementById("sendToAPI").addEventListener("click", sendToAPI);		

	table = new Tabulator("#tabulator-table", {
		data,
		layout:"fitColumns",
		addRowPos:"top",
		history:true,             //allow undo and redo actions on the table
		pagination:"local",       //paginate the data
		paginationSize:10,
		paginationCounter:"rows", //display count of paginated rows in footer
		movableColumns:true,
		columnDefaults:{
			tooltip:true,         //show tool tips on cells
		},
		columns:[
			{title:"Num", field:"num"},
			{title:"Target", field:"target"},
			{title:"Remap", field:"remap"},
			{title:"Nome", field:"nome", width: 300},
			{title:"SurveyId", field:"surveyid", width:120},
			{title:"Status", field:"status", width:120},
			{title:"Data inizio", field:"data_inizio", width:120, sorter:"date"},
			{title:"Data fine", field:"data_fine", width:120, sorter:"date"},
			{title:"var1", field:"var1"},
			{title:"cod1", field:"cod1"},
			{title:"var2", field:"var2"},
			{title:"cod2", field:"cod2"}
		],
	});

}

importClipboard = async() => {
	document.getElementById("errores").innerHTML = "";
    try {
        clipboard = await navigator.clipboard.readText();
    } catch (err) {
        console.log(err);
    }
    const rows = clipboard.split("\n");

	// VALIDACIONES
	const dateFormat = /^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/i;
    for (let i = 0; i < rows.length; i++) {
		const row = rows[i].split("\t");
		
		// Que todas las filas tengan 12 campos
        if (row.length !== 12) {
			const error = `<div class="alert alert-danger label-error" role="alert">Formato incorrecto</div>`;
			document.getElementById("errores").innerHTML += error;
            return;
        }


		// Validación: formato de fecha dd/mm/yyyy
		if (!row[6].match(dateFormat) || !row[7].match(dateFormat)) {
			const error = `<div class="alert alert-danger label-error" role="alert">Fila ${row[0]} no introducida, formato de fecha inválido</div>`;
			document.getElementById("errores").innerHTML += error;
            continue;
		}

		// Validación: fecha de inicio menor a fecha final
		const initDate = new Date(row[6]).getTime();
		const finalDate = new Date(row[7]).getTime();
		if (initDate > finalDate) {
			const error = `<div class="alert alert-danger label-error" role="alert">Fila ${row[0]} no introducida, fecha inicial mayor a final</div>`;
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
		
		// Activar botón de exportar a CSV
		document.getElementById("exportToCSV").addEventListener("click", exportTable);
    }

}

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

fileToTable = (data) => {
    const obj = Object.keys(data)[8];
    console.log(obj);
    console.log(data);
}

sendToAPI = () => {
    // const rows = document.querySelectorAll("#data-table tbody tr");
    // rows.forEach(row => {
    //     console.log(`Registrando en API: ${row.innerText}`);
    // })

}

exportTable = () => {
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