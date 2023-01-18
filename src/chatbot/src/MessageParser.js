// MessageParser starter code
class MessageParser {
  constructor(actionProvider, state) {
    this.actionProvider = actionProvider;
    this.state = state;
  }

  parse(message) {
    //console.log(message)
    const lowercase= message.toLowerCase()

    if (lowercase.includes("hello")){
      this.actionProvider.messageHandler("Hi, how can i help you")
    } else{
      this.handleSubmit(lowercase)
    }
  }

  handleSubmit(lowercase){
    fetch("https://c034-129-219-21-51.ngrok.io/getSuggestions", {
   method: 'POST',  
   header: ['Content-Type', 'text/plain'],
    body: lowercase
     }).then(response => response.json()
     .then(response => {
      this.actionProvider.messageHandler(response.output)
    }))}
}

export default MessageParser;