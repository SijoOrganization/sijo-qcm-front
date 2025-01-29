import{a as b}from"./chunk-23YI5YLA.js";import{F as D,G as M,g as I,i as E}from"./chunk-XIQ3NQN3.js";import{Bb as C,Gb as F,Ia as l,Pa as d,Ta as u,Ya as S,ca as c,cb as f,fb as k,ib as g,ic as T,ja as x,jb as v,ka as q,kb as o,lb as r,mb as Q,nb as w,pb as m,qb as p,tb as z,va as y,zb as s}from"./chunk-DDZ2KP6O.js";var h=class i{modal=c(D);static \u0275fac=function(e){return new(e||i)};static \u0275cmp=u({type:i,selectors:[["app-finish-confirmation"]],decls:17,vars:0,consts:[[1,"modal-header"],["id","modal-title",1,"modal-title"],["type","button","aria-describedby","modal-title",1,"btn-close",3,"click"],[1,"modal-body"],[1,"text-danger"],[1,"modal-footer"],["type","button",1,"btn","btn-outline-secondary",3,"click"],["type","button",1,"btn","btn-danger",3,"click"]],template:function(e,n){e&1&&(o(0,"div",0)(1,"h4",1),s(2,"Finish quiz"),r(),o(3,"button",2),m("click",function(){return n.modal.dismiss("Cross click")}),r()(),o(4,"div",3)(5,"p")(6,"strong"),s(7,"Are you sure you want to finish the quiz?"),r()(),o(8,"p"),s(9," This quiz will be closed and you will be no longer able to modify responses "),o(10,"span",4),s(11,"This operation can not be undone."),r()()(),o(12,"div",5)(13,"button",6),m("click",function(){return n.modal.dismiss("cancel click")}),s(14,"Return to quiz"),r(),o(15,"button",7),m("click",function(){return n.modal.close("Ok click")}),s(16,"Finish quiz"),r()())},encapsulation:2})};var $=(i,t)=>t.id;function j(i,t){if(i&1){let e=w();F(0),o(1,"div",7)(2,"input",8),m("change",function(){let a=x(e).$implicit,P=p().$implicit,A=p();return q(A.selectAnswer(P.id,a.id))}),r(),o(3,"label",9),s(4),r()()}if(i&2){let e=t.$implicit,n=p().$implicit,a=p().selectedResponses()[n.id].has(e.id);l(2),z("id","",n.id,"-",e.id,""),f("checked",a),l(),z("for","",n.id,"-",e.id,""),l(),C(" ",e.option," ")}}function V(i,t){if(i&1&&(o(0,"h3"),s(1),r(),o(2,"div",2)(3,"div",3)(4,"div",4)(5,"div",5),s(6),r(),o(7,"form",6),g(8,j,5,8,"div",7,$),r()()()()),i&2){let e=t.$implicit,n=t.$index;l(),C("Question ",n,""),l(5),C(" ",e.text," "),l(2),v(e.answers)}}var _=class i{quiz=y.required();modalService=c(M);quizService=c(b);router=c(E);selectedResponses=d({});ngOnInit(){let t={};this.quiz().questions.forEach(e=>{t[e.id]=new Set}),this.selectedResponses.set(t)}selectAnswer(t,e){this.selectedResponses.update(n=>{let a=n[t];return a.has(e)?a.delete(e):a.add(e),n})}openFinishConfirmationPopup(){this.modalService.open(h).closed.subscribe(()=>{this.submit()})}submit(){this.quizService.submit(this.selectedResponses(),this.quiz()._id).subscribe(t=>{this.router.navigate([`/submissions/${t.submissionId}`])})}static \u0275fac=function(e){return new(e||i)};static \u0275cmp=u({type:i,selectors:[["app-questions-container"]],inputs:{quiz:[1,"quiz"]},decls:5,vars:0,consts:[[1,"d-flex","justify-content-center","mt-4"],[1,"btn","btn-danger",3,"click"],[1,"container","mt-4"],[1,"card","shadow","p-3","mb-4"],[1,"card-body"],[1,"card-title","border","rounded","p-3",2,"white-space","pre-wrap","max-height","500px","overflow-y","auto"],[1,"d-flex","flex-column","gap-3"],[1,"btn-group"],["type","checkbox",1,"btn-check",3,"change","checked","id"],[1,"btn","btn-lg","text-start","btn-outline-primary",3,"for"]],template:function(e,n){e&1&&(g(0,V,10,2,null,null,$),o(2,"div",0)(3,"button",1),m("click",function(){return n.openFinishConfirmationPopup()}),s(4," Finish test "),r()()),e&2&&v(n.quiz().questions)},styles:[".btn-check[_ngcontent-%COMP%]:disabled + label[_ngcontent-%COMP%]{opacity:1}.wrong-icon[_ngcontent-%COMP%]{color:red;margin-left:10px;font-size:1.5rem;vertical-align:middle}"],changeDetection:0})};function W(i,t){if(i&1&&Q(0,"app-questions-container",1),i&2){let e=p();f("quiz",e.quiz())}}var N=class i{quiz=d(null);route=c(I);quizService=c(b);ngOnInit(){let t=this.route.snapshot.paramMap.get("id");t&&this.quizService.fetchQuizWithQuestions(t).subscribe(e=>{this.quiz.set(e)})}static \u0275fac=function(e){return new(e||i)};static \u0275cmp=u({type:i,selectors:[["app-quiz-taker"]],decls:2,vars:1,consts:[[1,"d-flex","justify-content-center","align-items-center","container","flex-column","gap-3"],[3,"quiz"]],template:function(e,n){e&1&&(o(0,"div",0),S(1,W,1,1,"app-questions-container",1),r()),e&2&&(l(),k(n.quiz()?1:-1))},dependencies:[T,_],encapsulation:2,changeDetection:0})};export{N as QuizTakerComponent};
