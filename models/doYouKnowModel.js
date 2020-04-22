const mongoose = require('mongoose')
const Schema = mongoose.Schema

const doYouKnowSchema = new Schema({

    docNum: String,
    title: String,
    readTime: Number,
    preImage: String,
    contents: Array,
	published_date: { type: Date, default: Date.now }
	
})

// Mongoose 내(內)에 DB없음. 만들어야합니다.

module.exports = mongoose.model('doYouKnow', doYouKnowSchema)

/* JSON example
{
	"docNum": "1",
	"title": "설레임을 분리수거 하는 방법",
	"readTime": 4,
	"preImage": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
    "contents": [
    	{
    		"secTitle": "잘못된 오해",
    		"image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
    		"secContent": "혹시 뚜껑도 그냥 플라스틱에 넣으면 되지 않을까?"
    		
    	},
    	{
    		"secTitle" : "잘못된 오해1",
    		"image" : "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
    		"secContent" : "혹시 뚜껑도 그냥 플라스틱에 넣으면 되지 않을까?"
    		
    	},
    	{
    		"secTitle" : "잘못된 오해2",
    		"image" : "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
    		"secContent" : "혹시 뚜껑도 그냥 플라스틱에 넣으면 되지 않을까?"
    		
    	},
    	{
    		"secTitle" : "잘못된 오해3",
    		"image" : "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
    		"secContent" : "혹시 뚜껑도 그냥 플라스틱에 넣으면 되지 않을까?"
    		
    	},
    	{
    		"secTitle" : "잘못된 오해4",
    		"image" : "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
    		"secContent" : "혹시 뚜껑도 그냥 플라스틱에 넣으면 되지 않을까?"
    		
    	},
    	{
    		"secTitle" : "잘못된 오해5",
    		"image" : "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
    		"secContent" : "혹시 뚜껑도 그냥 플라스틱에 넣으면 되지 않을까?"
    	}]
      
}
*/