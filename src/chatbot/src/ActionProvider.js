// ActionProvider starter code
class ActionProvider {
    constructor(
     createChatBotMessage,
     setStateFunc,
     createClientMessage,
     stateRef,
     createCustomMessage,
     ...rest
   ) {
     this.createChatBotMessage = createChatBotMessage;
     this.setState = setStateFunc;
    //  this.createClientMessage = createClientMessage;
    //  this.stateRef = stateRef;
    //  this.createCustomMessage = createCustomMessage;
   }

   messageHandler = (mes) => {
     console.log(mes)
       const message = this.createChatBotMessage(mes)
       this.setChatBotMessage(message)  
    }

   setChatBotMessage = (message) => {
      this.setState(state => ({ ...state, messages: [...state.messages, message] }))
   }
 }
 
 export default ActionProvider;