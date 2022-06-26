
new Vue({
	el: '#app',
	data() {
		return {
			file: {
				sheetName: null,
			},
			// 容错系数
			errorRange: 3,
			// 原始数据
			tableData: [],
			// 预处理后的json数组
			jsonArrData: [],
			// 存在优先级的json数组
			priorityArrData: []
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
			// 预处理
			this.jsonArrData = this.tableData.map(row =>  this.handleBefore(row))

			// 判断是否存在优先级的行
			this.jsonArrData.forEach(row => {
				if(this.hasPriority(row.source.needRange)) {
					row.status.hasPriority = true
				}
			})

			// 渲染到页面
			this.priorityArrData = this.getPriorityFormatData()

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

			// 转换格式
			return {
				source: {
					name: _list[0],
					needTotal: _list[1],
					needRange: _list.slice(2, 8),
					received: _list[8]
				},
				result: {
					needTotal: 0,
					needRange: [0, 0, 0, 0, 0, 0]
				},
				status: {
					id: getUuid(),
					hasPriority: false
				}
			}
		},

		/** ----- 表格相关 ----- **/

		// 判断是否存在优先级
		hasPriority(rowData) {
			const zList = []
			const fList = []
			rowData.forEach(item => {
				if(item > 0) {
					zList.push(item)
				}
				if(item < 0) {
					fList.push(item)
				}
			})
			if(!isEmpty(zList) && !isEmpty(fList)) {
				const s_zList = new Set()
				permutation(zList, zList.length).forEach(item => {
					let sum = 0
					item.forEach(p => sum += p)
					s_zList.add(sum)
				})
				const s_fList = new Set()
				permutation(fList, fList.length).forEach(item => {
					let sum = 0
					item.forEach(p => sum += Math.abs(p))
					s_fList.add(sum)
				})
				// 比较是否存在相等
				return (Array.from(s_fList).filter(f => {
					return (Array.from(s_zList).filter(z => Math.abs(z - f) <= this.errorRange).length > 0)
				}).length > 0)
			}
			// 只有同时存在正负数才有优先级的可能
			return false;
		},
		// 获取表格展示内容的格式
		getPriorityFormatData() {
			return this.jsonArrData
				.filter(row => row.status.hasPriority)
				.map(row => this.changeToPriorityFormatData(row))
		},
		// 转换一行格式
		changeToPriorityFormatData(row) {
			const needRange = row.source.needRange;
			return {
				id: {data: row.status.id, canSelected: false},
				name: {data: row.source.name, canSelected: false},
				n0: {data: needRange[0], canSelected: true, selectStatus: false},
				n1: {data: needRange[1], canSelected: true, selectStatus: false},
				n2: {data: needRange[2], canSelected: true, selectStatus: false},
				n3: {data: needRange[3], canSelected: true, selectStatus: false},
				n4: {data: needRange[4], canSelected: true, selectStatus: false},
				n5: {data: needRange[5], canSelected: true, selectStatus: false},
			}
		},
		// 单元格点击事件
		selectCell(row, column, cell, event) {
			if(column.property) {
				this.priorityArrData = this.priorityArrData.map(item => {
					if (item.id.data === row.id.data) {
						const key = column.property.split('.')[0]
						if (item[key].canSelected) {
							item[key].selectStatus = !item[key].selectStatus
							return item
						}
					}
					return item
				})
			}
		},
		// 匹配单元格样式
		cellStyle(data) {
			if(data.column.property) {
				const key = data.column.property.split('.')[0]
				if(data.row[key].canSelected && data.row[key].selectStatus) {
					return 'color: black; background-color: #e8c387; font-size: 17px;'
				}
			}
			return ''
		},
		// 抵扣一行数据
		submit(row) {

			// console.log(row)
			// console.log(this.jsonArrData)
			// console.log(this.priorityArrData)

			this.priorityArrData = this.priorityArrData.map(item => {
				if (item.id.data === row.id.data) {
					// 找到要抵扣的数据并记录位置
					const indexList = []
					const list = []
					Object.keys(row).forEach(tmp => {
						if(row[tmp].selectStatus) {
							indexList.push(tmp)
							list.push(row[tmp].data)
						}
					})
					// 抵扣一行
					const res = this.deduction(list)

					// 替换原数据
					for (let i = 0; i < indexList.length; i++) {
						item[indexList[i]].data = res[i]
					}
				}
				return item
			})


		},
		// 抵扣
		deduction(list) {
			// 是否跳过
			if(isEmpty(list)) {
				// console.log("略过一行空数据")
				return list
			}

			// 到负数就停（第一个不处理，所以是减2）
			for(let i = (list.length-2) ; i >= 0 ; i--) {
				if(list[i] < 0) {

					// 找出正数并记录位置
					const indexList = []
					const targetList = []
					for (let j = i+1; j < list.length; j++) {
						if(list[j] > 0) {
							indexList.push(j)
							targetList.push(list[j])
						}
					}

					// 执行一轮抵扣
					const res = this.deduction_per(list[i], targetList)

					// 替换原始数据
					list[i] = res.num
					for (let j = 0; j < indexList.length; j++) {
						list[indexList[j]] = res.list[j]
					}
					// console.log('替换后：', list)
				}
			}
			return list;

		},
		// 抵扣 - 某一行的某一次替换
		deduction_per(num, list) {

			// console.log('==> 开始一次替换')
			// console.log('num', num)
			// console.log('list', list)

			// 备份一个，后面补回要比较
			const back_list = list.concat()

			// 正数方便比较
			const _num = -num

			// 是否有符合条件的
			if(!isEmpty(list)) {

				// 先全部替换成0
				let actualNum = 0;
				list = list.map(_tmp => {
					actualNum = actualNum += _tmp
					return 0
				})

				// 多退少补
				if(_num === actualNum) {
					num = 0
				} else if (_num > actualNum) {
					num = actualNum - _num
				} else if (_num < actualNum) {
					num = 0
					// 还剩多少没还的钱
					let leftNum = actualNum - _num
					// 从索引开始，逐个补回
					for (let i = 0 ; i < list.length ; i++) {
						const _back = back_list[i];
						if(_back >= leftNum) {
							list[i] = leftNum
							break
						} else {
							list[i] = _back
							leftNum = leftNum - _back
						}
					}
				}
			}

			// console.log('==> 结束一次替换', {num: num, list: list})

			// 返回结果
			return {
				num: num,
				list: list
			}

		},
		// 清除点击样式
		cleanClick(row) {
			this.priorityArrData = this.priorityArrData.map(item => {
				if (item.id.data === row.id.data) {
					// 抹去点击样式
					Object.keys(row).forEach(tmp => {
						if(row[tmp].selectStatus) {
							row[tmp].selectStatus = false
						}
					})
				}
				return item
			})
		},
		// 还原一行数据
		returnBack(row) {
			this.priorityArrData = this.priorityArrData.map(item => {
				if (item.id.data === row.id.data) {
					// 找到原始数据并替换
					return this.jsonArrData
						.filter(_row => _row.status.id === item.id.data)
						.map(_row => this.changeToPriorityFormatData(_row))[0]
				}
				return item
			})
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
			let key = true;
			while(key) {
				// 每次发生替换，都要从头再来一次
				key = this.handlePriority(jsonRow)
			}

		},
		// 处理优先级
		handlePriority(jsonRow) {

			console.log('进行一次优先级判断')

			// 到负数就停（第一个不处理，所以是4开始）
			for(let i = jsonRow.source.needRange.length-2 ; i >= 0 ; i--) {
				if(jsonRow.source.needRange[i] < 0) {
					console.log(jsonRow.source.needRange)
					const res = this.handlePriority_Per(jsonRow.source.needRange[i], jsonRow.source.needRange.slice(i+1, jsonRow.source.needRange.length))
					jsonRow.source.needRange[i] = res.num
					for (let j = 0; j <res.list.length; j++) {
						jsonRow.source.needRange.splice(i+1+j, 1, res.list[j])
					}
					console.log(jsonRow.source.needRange)
					if(res.hasReplace) {
						return true;// 发生了替换
					}
				}
			}
			return false;// 没发生替换
		},
		// 处理优先级 - 某一行的某一次替换
		handlePriority_Per(num, list) {

			// console.log('==> 开始一次替换')
			// console.log('==> num', num)
			// console.log('==> list', list)

			// 是否发生了优先级替换
			let hasReplace = false;

			// 备份一个，后面补回要比较
			const compare_list = list.concat()

			// 正数方便比较
			const _num = -num

			// 负数不参与优先级
			const _list = list.filter(item => item > 0)
			const permutation_list = permutation(_list, _list.length)

			// 寻找符合条件的组合
			let targetList = null;
			let targetSum = 0;
			for (let i = 0; i < permutation_list.length; i++) {
				let sum = 0
				permutation_list[i].forEach(item => sum += item)
				if(_num >= (sum-3) && _num <= (sum + 3)) {
					targetList = permutation_list[i];
					targetSum = sum
					break;
				}
			}

			// 是否有符合条件的
			if(!isEmpty(targetList)) {

				// 发生替换
				hasReplace = true;

				// 记录被替换的位置
				const indexList = []

				// 替换数据
				targetList.forEach(item => {
					const index = list.indexOf(item);
					indexList.push(index)
					list.splice(index, 1, 0);
				})

				// 多退少补
				if(_num === targetSum) {
					num = 0
				} else if (_num > targetSum) {
					num = targetSum - _num
				} else if (_num < targetSum) {
					num = 0
					// 还剩多少没还的钱
					let otherNum = targetSum - _num
					// 排序因为优先抵扣远的帐，所以补回优先补近的帐
					indexList.sort(function(a,b){
						return a-b;
					})
					// 从索引开始，逐个补回
					for (let i = 0; i < indexList.length; i++) {
						const _temp = compare_list.slice(indexList[i], indexList[i]+1)[0];
						if(_temp >= otherNum) {
							list.splice(indexList[i], 1, otherNum)
							break
						} else {
							list.splice(indexList[i], 1, _temp)
							otherNum = otherNum - _temp
						}
					}
				}
			}

			// console.log('==> 结束一次替换', {num: num, list: list})

			// 返回结果
			return {
				hasReplace: hasReplace,
				num: num,
				list: list
			}

		}
	}
});







