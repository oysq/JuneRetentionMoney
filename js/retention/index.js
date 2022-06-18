
new Vue({
	el: '#app',
	data() {
		return {
			file: {
				sheetName: null,
			},
			sourceData: {
				jsonData: []
			}
		}
	},
	methods: {
		readExcel(event) {
			// 拿取文件对象
			const file = event.currentTarget.files[0];
			const fileReader = new FileReader();
			fileReader.onload = ev => {
				this.handleExcel(ev.target.result)
			}
			fileReader.readAsBinaryString(file);
		},
		handleExcel(data) {
			const wb = XLSX.read(data, {
				type: "binary"
			});
			this.file.sheetName = wb.SheetNames[0];
			this.sourceData.jsonData = XLSX.utils.sheet_to_json(wb.Sheets[this.file.sheetName])
			console.log(this.sourceData.jsonData)
		}
	}
});







