import{BaseComponent as g,html as v,define as $}from"../core.min.js";var c=new Map,l=new Set,f=null,p="en";function u(a,t){c.set(a.toLowerCase(),t)}function m(){return f||document.documentElement.lang||p}function d(a){return l.add(a),()=>l.delete(a)}function h(a,t,e,n){let r=a.dataset[t],s=c.get(a.nodeName.toLowerCase())?.[m()]?.[t],o=r!==void 0?r:s!==void 0?s:e;return n?x(o,n):o}function x(a,t){return a.replace(/\{(\w+)\}/g,(e,n)=>Object.prototype.hasOwnProperty.call(t,n)?String(t[n]):e)}var b={en:{label:"Tabs"},tr:{label:"Sekmeler"}};u("dv-tabs",b);var A=0,i=class extends g{static observedAttributes=["data-active"];#e=++A;#t=[];prepare(t){this.#t=t?Array.from(t.children).map((e,n)=>e.getAttribute("data-tab")??`Tab ${n+1}`):[]}initialState(){return{active:this.#n(this.num("active",0)),labels:[...this.#t]}}onAttribute(t,e){t==="data-active"&&this.activateIndex(Number(e)||0)}connected(){this.#a(),this.onCleanup(d(()=>this.requestUpdate()))}updated(t){t.includes("active")&&(this.#a(),this.#s()?.focus())}activate(t,e){this.activateIndex(Number(e.getAttribute("data-index")))}onKeydown(t){let e=this.state.labels.length-1;if(e<0)return;let n=null;switch(t.key){case"ArrowRight":n=this.state.active>=e?0:this.state.active+1;break;case"ArrowLeft":n=this.state.active<=0?e:this.state.active-1;break;case"Home":n=0;break;case"End":n=e;break;default:return}t.preventDefault(),this.activateIndex(n)}onFocusin(t,e){this.activateIndex(Number(e.getAttribute("data-index")))}activateIndex(t){let e=this.#n(t);e!==this.state.active&&(this.state.active=e,this.emit("tab",{index:e}))}template(){return v`
      <div role="tablist" aria-label="${h(this,"label","Tabs")}">
        ${this.state.labels.map((t,e)=>v`
          <button type="button" role="tab"
            id="${this.#i(e)}"
            aria-selected="${String(e===this.state.active)}"
            aria-controls="${this.#r(e)}"
            tabindex="${e===this.state.active?0:-1}"
            data-index="${e}"
            data-on:click="activate"
            data-on:keydown="onKeydown"
            data-on:focusin="onFocusin">${t}</button>
        `)}
      </div>
      <div class="dv-tabs-panels">${this.outlet}</div>
    `}#n(t){let e=this.#t.length-1;return!Number.isFinite(t)||t<0?0:Math.min(t,Math.max(e,0))}#a(){let t=this.querySelector("dv-outlet");t&&Array.from(t.children).forEach((e,n)=>{e.setAttribute("role","tabpanel"),e.id=this.#r(n),e.setAttribute("aria-labelledby",this.#i(n)),e.tabIndex=0,e.hidden=n!==this.state.active})}#s(){return this.querySelector('[role="tab"][aria-selected="true"]')}#i(t){return`dv-tabs-${this.#e}-tab-${t}`}#r(t){return`dv-tabs-${this.#e}-panel-${t}`}};$("dv-tabs",i);export{i as DvTabs};
