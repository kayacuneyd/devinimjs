import{BaseComponent as s,html as a,define as n}from"../core.min.js";export class DvCounter extends s{static observedAttributes=["data-start","data-step"];initialState(){return{count:this.num("start",0),step:this.num("step",1)}}onAttribute(t,e){t==="data-start"&&(this.state.count=Number(e)||0),t==="data-step"&&(this.state.step=Number(e)||1)}increment(){this.state.count+=this.state.step,this.emit("change",{count:this.state.count})}decrement(){this.state.count-=this.state.step,this.emit("change",{count:this.state.count})}template(){return a`
      <button type="button" data-on:click="decrement" aria-label="Decrease">−</button>
      <output aria-live="polite">${this.state.count}</output>
      <button type="button" data-on:click="increment" aria-label="Increase">+</button>
    `}}n("dv-counter",DvCounter);
