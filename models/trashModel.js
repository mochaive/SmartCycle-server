const mongoose = require('mongoose')
const Schema = mongoose.Schema

const trashSchema = new Schema({

    id: String,
    name: String,
    imageURL: String,
    information: {
        compo_number: Number,
        step_number: Number,
        composition: Array,
        step: Array,
		time_rot: String
	},
	nugu_script: String,
	published_date: { type: Date, default: Date.now }
	
})


module.exports = mongoose.model('trash', trashSchema)

/* JSON example
{
	"id": "0",
	"name": "페트병",
	"imageURL": null,
	"information": {
		"compo_number": 3,
		"step_number": 5,
		"composition": [
			{
				"part": "페트병",
				"value": "PET"
			},
			{
				"part": "뚜껑, 고리",
				"value": "플라스틱"
			},
			{
				"part": "라벨지",
				"value": "비닐류"
			}],
		"step": [
			{
				"imageURL_step": null,
				"number": 1,
				"contents": "뚜껑을 분리해 주세요. 뚜껑은 플라스틱이랍니다."
			},
			{
				"imageURL_step": null,
				"number": 2,
				"contents": "최대한 부피를 줄이기 위해 납작하게 구겨 주세요."
			},
			{
				"imageURL_step": null,
				"number": 3,
				"contents": "라벨지를 제거해 주세요. 페트병, 뚜껑과 달리 라벨지는 비닐류랍니다."
			},
			{
				"imageURL_step": null,
				"number": 4,
				"contents": "뚜껑과 고리를 제거해 주세요. 뚜껑과 고리는 플라스틱이랍니다."
			},
			{
				"imageURL_step": null,
				"number": 5,
				"contents": "페트병은 PET에, 뚜껑과 고리는 플라스틱에, 라벨지는 비닐류에 분리 배출해 주세요."
			}],
			"time_rot": "500년"
	},
	"nugu_script": "페트병은 뚜껑을 분리하고, 납작하게 구긴 후 라벨과 뚜껑 고리를 제거하고 페트병은 피이티에, 뚜껑과 고리는 플라스틱에, 라벨지는 비닐류에 분리 배출해 주세요."
}
*/