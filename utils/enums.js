var enums = {
	TaskStatus: {
		Init: 0,
		Waiting: 1,
		Compiling: 2,
		Done: 3,
		Canceled: 4
	},
	ToChildMsgTypes: {
		Run: 0,
		Stop: 1
	},
	FromChildMsgTypes: {
		Ready: 0,
		Done: 1,
		Error: 2
	}
}

module.exports = enums;
