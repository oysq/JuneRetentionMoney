
new Vue({
	el: '#app',
	data() {
		return {
			file: {
				sheetName: null,
			},
			tableData: []
		}
	},
	created() {
	},
	methods: {
		// 读取文件
		readExcel(event) {
			// 拿取文件对象
			const file = event.currentTarget.files[0];
			const fileReader = new FileReader();
			fileReader.onload = ev => {
				this.handleExcel(ev.target.result)
			}
			fileReader.readAsBinaryString(file);
		},
		// 读取表格
		handleExcel(data) {
			const wb = XLSX.read(data, {
				type: "binary"
			});
			this.file.sheetName = wb.SheetNames[0];
			this.tableData = XLSX.utils.sheet_to_json(wb.Sheets[this.file.sheetName], {header: 1, range: 1})
			this.handleTable();
		},
		// 处理表格
		handleTable() {
			// console.log(this.tableData)
			if(isEmpty(this.tableData)) {
				alert("表格内容为空")
				return
			}
			// this.tableData.forEach(data => this.handleData(data))
			this.handleData(this.tableData[2])
		},
		// 处理一行数据
		handleData(rowData) {
			// 是否跳过
			if(isEmpty(rowData)) {
				console.log("略过一行空数据")
				return
			}
			console.log("原始数据", rowData)

			// 预处理
			rowData = this.handleBefore(rowData)
			console.log("预处理后的数据", rowData)

			// 转换格式
			const jsonRow = {
				source: {
					name: rowData[0],
					needTotal: rowData[1],
					needRange: rowData.slice(2, 8),
					received: rowData[8]
				},
				result: {
					needTotal: 0,
					needRange: [0, 0, 0, 0, 0, 0]
				}
			}

			// 处理优先级
			this.handlePriority(jsonRow)

		},
		// 预处理
		handleBefore(rowData) {
			// 这里不能用forEach，会跳过空位置
			let _list = []
			for (let i = 0; i < rowData.length; i++) {
				if(isEmpty(rowData[i]) || rowData[i] === '-') {
					_list.push(0)
				} else {
					_list.push(rowData[i])
				}
			}
			return _list
		},
		// 处理优先级
		handlePriority(jsonRow) {

			// 到负数就停（第一个不处理，所以是4开始）
			for(let i = jsonRow.source.needRange.length-2 ; i >= 0 ; i--) {
				if(jsonRow.source.needRange[i] < 0) {
					this.handlePriority_Per(jsonRow.source.needRange[i], jsonRow.source.needRange.slice(i+1, jsonRow.source.needRange.length))
				}
			}
		},
		// 处理优先级 - 某一行的某一次替换
		handlePriority_Per(num, list) {
			console.log('num', num)
			console.log('list', list)
		}
	}
});







