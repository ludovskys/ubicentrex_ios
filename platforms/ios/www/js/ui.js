var wwin=document.body.clientWidth;
var hwin=document.body.clientHeight;
var device = (navigator.userAgent.match(/iPad/i))  == "iPad" ? "iPad" : (navigator.userAgent.match(/iPhone/i))  == "iPhone" ? "iPhone" : (navigator.userAgent.match(/Android/i)) == "Android" ? "Android" : (navigator.userAgent.match(/BlackBerry/i)) == "BlackBerry" ? "BlackBerry" : "null";
//cpage================================================================================
function cpage(_ref,_pref,_index,_animation){
	this.ref=_ref;
	this.pref=_pref;
	this.id='page'+_index;
	if(typeof(_animation)=='undefined')this.animation='';
	else this.animation=_animation;
	this.container=document.createElement("div");
	this.container.setAttribute('id',this.id);
	this.index=_index;
	this.container.style.zIndex=this.index;
	this.header=null;
	this.footer=null;
	this.w=wwin;
	this.h=hwin;
	this.htarget=document.body;
	this.htarget.appendChild(this.container);
	switch(this.animation){
		case '':
		case 'none':
			this.container.className='page center';
		break;
		
		case 'right':
			this.container.className='page right';
			if(this.index>1)setTimeout("document.getElementById('page"+(this.index-1)+"').className ='page transition3 left'",200);
			setTimeout(this.ref+".container.className ='page transition2 center'",100);
		break;
		
		case 'top':
			this.container.className='page top';
			setTimeout(this.ref+".container.className ='page transition2 center'",100);
		break;
	}
	
}

cpage.prototype.faddcontent=function(ht){
	this.content=document.createElement('div');
	this.content.className='content';
	this.container.appendChild(this.content);
	if(typeof(ht)!='undefined')this.content.innerHTML=ht;
	var top='0px',bottom='0px';
	if(this.header)top='40px';
	if(this.footer)bottom='40px';
	this.content.style.top=top;
	this.content.style.bottom=bottom;
}

cpage.prototype.fsetcontent=function(ht){
	if(!this.content)return false;
	this.content.innerHTML=ht;
	return true;
}

cpage.prototype.faddheader=function(ht){
	this.header=document.createElement('div');
	this.header.className='header';
	this.container.appendChild(this.header);
	if(typeof(ht)!='undefined')this.header.innerHTML=ht;
	if(this.content)this.content.style.top='40px';
}

cpage.prototype.fsetheader=function(ht){
	if(!this.header)return false;
	this.header.innerHTML=ht;
	return true;
}

cpage.prototype.faddfooter=function(ht){
	this.footer=document.createElement('div');
	this.footer.className='footer';
	this.container.appendChild(this.footer);
	if(typeof(ht)!='undefined')this.footer.innerHTML=ht;
	if(this.content)this.content.style.bottom='40px';
}

cpage.prototype.fsetfooter=function(ht){
	if(!this.footer)return false;
	this.footer.innerHTML=ht;
	return true;
}

cpage.prototype.fdelete=function(animation){
	if(typeof(animation)=='undefined')animation=this.animation;
	switch(animation){
		case '':
		case 'none':
			if(this.index>1)document.getElementById("page"+(this.index-1)).className ='page center';
			this.htarget.removeChild(this.container);
		break;
		case 'right':
			if(this.index>1)document.getElementById("page"+(this.index-1)).className ='page transition1 center';
			this.container.className='page transition2 right';
			setTimeout(this.ref+".htarget.removeChild("+this.ref+".container)",600);
		break;	
	}
}

//cpopup==============================================================
function cpopup(_ref,_pref,_left,_top,_right,_bottom){
	this.ref=_ref;
	this.pref=_pref;
	this.id='popup';
	if(typeof(_left)!='undefined' && !isNaN(_left))this.left=_left;else this.left=0;
	if(typeof(_top)!='undefined' && !isNaN(_top))this.top=_top;else this.top=null;
	if(typeof(_right)!='undefined' && !isNaN(_right))this.right=_right;else this.right=0;
	if(typeof(_bottom)!='undefined' && !isNaN(_bottom))this.bottom=_bottom;else this.bottom=null;
	this.container=document.createElement("div");
	this.container.setAttribute('id',this.id);
	this.container.addEventListener('touchstart', function(event) {
		fback_history();
    }, false);
	this.container.style.zIndex=100;
	this.container.className='page center';
	this.htarget=document.body;
	this.htarget.appendChild(this.container);
}

cpopup.prototype.faddcontent=function(ht){
	this.content=document.createElement('div');
	this.content.style.position='absolute';
	this.content.style.left=this.left+'px';
	if(this.top)this.content.style.top=this.top+'px';
	this.content.style.right=this.right+'px';
	if(this.bottom)this.content.style.bottom=this.bottom+'px';
	this.content.className='pop small';
	setTimeout(this.ref+".content.className ='pop transition2 big'",50);
	this.container.appendChild(this.content);
	if(typeof(ht)!='undefined')this.content.innerHTML=ht;
	this.content.addEventListener('touchstart', function(event) {
		event.stopPropagation();
    }, false);
}

cpopup.prototype.fdelete=function(){
	this.content.className='pop transition2 small';
	setTimeout(this.ref+".htarget.removeChild("+this.ref+".container);opopup=null",200);
}

//cpopup===============================================================
function cdialog(_ref,_pref,_w,_h,_pos,_corner){
	this.ref=_ref;
	this.pref=_pref;
	this.id='dialog';
	if(document.getElementById(this.id))document.body.removeChild(document.getElementById(this.id));
	this.w=_w;
	this.h=_h;
	if(typeof(_pos)=='undefined')this.pos='center';
	else this.pos=_pos;
	
	if(typeof(_corner)=='undefined')this.corner=true;
	else this.corner=_corner;
	
	this.container=document.createElement("div");
	this.container.setAttribute('id',this.id);
	this.container.style.zIndex=200;
	this.container.className='page center transparent';
	this.container.style.position='absolute';
	this.htarget=document.body;
	this.htarget.appendChild(this.container);
}

cdialog.prototype.faddcontent=function(ht){
	this.content=document.createElement('div');
	this.content.style.position='absolute';
	this.content.style.left=(document.body.clientWidth-this.w)/2+'px';
	this.content.style.height=this.h+'px';
	this.content.style.width=this.w+'px';
	this.content.style.backgroundColor='#fff';
	switch(this.pos){
		case "center":
			this.content.style.top=(document.body.clientHeight-this.h)/2+'px';
			if(this.corner===true)this.content.style.borderRadius='3px';
			this.content.className='pop small';
			setTimeout(this.ref+".content.className ='pop transition big'",50);
		break;
		case "top":
			this.content.style.top='0px';
			if(this.corner===true)this.content.style.borderRadius='0px 0px 3px 3px';
		break;
		case "bottom":
			this.content.style.bottom='0px';
			if(this.corner===true)this.content.style.borderRadius='3px 3px 0px 0px';
			this.content.className='pop under_btm';
			setTimeout(this.ref+".content.className ='pop transition btm'",50);
		break;
	}
	this.container.appendChild(this.content);
	if(typeof(ht)!='undefined')this.content.innerHTML=ht;
}

cdialog.prototype.fsetcontent=function(ht){
	if(!this.content)return false;
	this.content.innerHTML=ht;
	return true;
}

cdialog.prototype.fdelete=function(){
	this.content.innerHTML='';
	switch(this.pos){
		case "center":
			this.content.className='pop transition small';
		break;
		case "top":
		break;
		case "bottom":
			this.content.className='pop transition under_btm';
		break;
	}
	setTimeout(this.ref+".htarget.removeChild("+this.ref+".container);odialog=null",200);		
}

/**@fnew_page function create page, popup or dialog==================================================
 * ex:
 * var a=new Array();
	a["header"]="<a onClick='"+this.ref+".fnav();' class='menu_left' style=\"background:url('img/icon_ul.png') no-repeat center center\"> </a>";
	a["header"]+="<a class='menu_right' style=\"right:40px;background:url('img/icon_search2.png') no-repeat center center;background-size:20px auto;\"> </a>";
	a["header"]+="<a onClick=\""+this.ref+".ftest();\" class='menu_right' style=\"background:url('img/icon_plus.png') no-repeat center center\"> </a>";
	a["content"]=button("test","","style=\"width:100px;\"","btt");
	a["content"]=checkbox(this.pref+"testck","",false);
	a["content"]=text(this.pref+"tes");
	this.main_page=fnew_page(a,'');
 */
var apage=new Array();
var indpage=0;
var opopup;
var odialog;
function fnew_page(ar,animation){
	if(typeof(ar["tp"])=='undefined')ar["tp"]="page";
	switch(ar["tp"]){
		case "page":
			if(typeof(ar["header"])=='undefined' && typeof(ar["content"])=='undefined' && typeof(ar["footer"])=='undefined')return false;
			indpage++;
			apage[indpage]=new cpage("apage["+indpage+"]","apage["+indpage+"]",indpage,animation);
			if(typeof(ar["header"])!='undefined')apage[indpage].faddheader(ar["header"]);
			if(typeof(ar["content"])!='undefined')apage[indpage].faddcontent(ar["content"]);
			else apage[indpage].faddcontent();
			if(typeof(ar["footer"])!='undefined')apage[indpage].faddfooter(ar["footer"]);
			return apage[indpage];
		break;
		
		case "popup":
			opopup=new cpopup("opopup","opopup",ar["left"],ar["top"],ar["right"],ar["bottom"]);
			if(typeof(ar["content"])!='undefined')opopup.faddcontent(ar["content"]);
			return opopup;
		break;
		
		case "dialog":
			odialog=new cdialog("odialog","odialog",ar["w"],ar["h"],ar["pos"],ar["corner"]);
			if(typeof(ar["content"])!='undefined')odialog.faddcontent(ar["content"]);
			return odialog;
		break;
	}	
}

/**back to history======================================================================= */
function fback_history(animation){
	if(odialog){
		odialog.fdelete(animation);
		return;
	}
	if(opopup){
		opopup.fdelete(animation);
		return;
	}
	if(indpage<3){
		if(indpage==1)navigator.app.exitApp();
		else if(oconsole.nav_open===false)oconsole.fnav();
		else fconfirm("Voulez-vous vraiment quitter l'application ?","navigator.app.exitApp()");
		return;
	}
	if(oconsole.osv_calls){
		oconsole.osv_calls.fdelete();
		delete oconsole.osv_calls;
	}
	
	apage[indpage].fdelete(animation);
	indpage--;
}

/**@fcontext_menu==========================================================================
 * ex:
 * a["header"]="<a onClick=\""+this.ref+".fcontext_menu_test(this);\" class='menu_right'> </a>";
 * cconsole.prototype.fcontext_menu_test=function(obj){
	var tx="<div style='height:300px;border:1px solid #ccc;' onClick=\""+this.ref+".ftest()\">test pop</div>";
	fcontext_menu(obj,tx,this.w*0.6);
   }
 */
function fcontext_menu(obj,txt,width,left){
	if(typeof(width)=='undefined')width=wwin/2;
	var a=new Array();
	a["tp"]='popup';
	if(getOffsetPosition(obj,"Top")<hwin/2)a["top"]=getOffsetPosition(obj,"Top")+obj.offsetHeight-1;
	else a["bottom"]=hwin-getOffsetPosition(obj,"Top")-1;
	
	if(getOffsetPosition(obj,"Left")<=wwin/3)a["left"]=4;
	else if(getOffsetPosition(obj,"Left")>wwin/3 && getOffsetPosition(obj,"Left")<wwin/3*2)a["left"]=(wwin-width)/2;
	else a["left"]=wwin-width;

	if(getOffsetPosition(obj,"Left")<=wwin/3)a["right"]=wwin-width;
	else if(getOffsetPosition(obj,"Left")>wwin/3 && getOffsetPosition(obj,"Left")<wwin/3*2)a["right"]=(wwin-width)/2;
	else a["right"]=4;
	
	if(typeof(left)!="undefined")a["left"]=left;
	a["content"]=txt;
	var cm=fnew_page(a);
	cm.content.style.borderRadius='3px';
	cm.content.style.boxShadow="0px 1px 4px 0px #999";
	return cm;
}

//alert=========================================
function fconfirm(tx,func_ok,func_cancel,height){
	if(!func_ok)func_ok="";
	if(!func_cancel)func_cancel="";
	
	var a=new Array();
	a["tp"]='dialog';
	a["w"]=wwin-30;
	if(!height)a["h"]=110;
	else a["h"]=height;
	a["content"]="<div style='position:relative;margin:10px;font-size:18px;'>"+tx+"</div>"+
		"<div style='position:absolute;right:0px;bottom:0px;width:100%;font-size:20px;text-align:center;border-top:1px solid #ccc;'>" +
		"<div onclick=\""+func_cancel+"fback_history();\" style='height:40px;line-height:40px;width:"+(wwin/2-15)+"px;color:red;position:relative;float:left;border-right:1px solid #ccc'>Annuler</div>"+
		"<div onclick=\""+func_ok+";fback_history();\" style='height:40px;line-height:40px;width:"+(wwin/2-16)+"px;color:blue;position:relative;float:right;'>Ok</div>" +
		"</div>";
	
	return fnew_page(a);	
}

//toast=========================================
var toast=null;
var toast_timer=null;
function ftoast(tx,duration){
	fcancel_toast();
	toast=document.createElement('div');
	toast.innerHTML=tx;
	toast.className="toast";
	document.body.appendChild(toast);
	toast.style.left=(wwin-toast.offsetWidth)/2+"px";
	if(typeof(duration)=="undefined")duration=3200;
	toast_timer=setTimeout(function(){document.body.removeChild(toast);toast=null;},duration);
}
function fcancel_toast(){
	if(toast){
		document.body.removeChild(toast);
		toast=null;
		if(toast_timer)clearTimeout(toast_timer);
	}
}

//show loading
var loading_img=document.createElement('hr');
loading_img.className='catchadream';
function fshow_loading(){
	 if(!apage[indpage])return;
	 if(loading_img.parentNode)return;
	 apage[indpage].header.appendChild(loading_img);
}

function fcancel_loading(){
	if(!loading_img.parentNode)return;
	loading_img.parentNode.removeChild(loading_img);
}
/**@cpicker=========================================
 * picker item for picker widget like timepicker
 */
function cpicker(_ref,_pref,_param,_htarget){
	this.ref=_ref;
	this.pref=_pref;
	this.htarget=_htarget;
	this.param=_param;
	this.offsetY=this.param.offsetY;
	this.offsetTop=this.param.offsetTop;
	this.movetop=this.param.movetop;
	this.dra=false;
	this.divp=null;
	this.aritems=this.param.aritems;
	if(typeof(this.param.lheight)!='undefined')this.lheight=this.param.lheight;
	else this.lheight=50;
}
cpicker.prototype.fcreatehtml=function(){
	var tx="<div class='dwwu'></div>";
	tx+="<div id='"+this.pref+"div' style='position:relative;-webkit-transition: all 0.1s ease-out; transition: all 0.1s ease-out; -webkit-transform: translate3d(0px,"+this.movetop+"px,0px);'>";
	for(var j in this.aritems) tx+="<div class='pic_li' style='height:"+this.lheight+"px;line-height:"+this.lheight+"px;'>"+this.aritems[j]+"</div>";
	tx+="</div><div class='dwwd'></div>";
	this.htarget.innerHTML=tx;
	this.divp=document.getElementById(this.pref+"div");
}

cpicker.prototype.freset_items=function(){
	if(!this.divp)return;
	var tx="";
	for(var j in this.aritems) tx+="<div class='pic_li' style='height:"+this.lheight+"px;line-height:"+this.lheight+"px;'>"+this.aritems[j]+"</div>";
	this.divp.innerHTML=tx;
	if(this.movetop<-this.lheight*(this.aritems.length-2))this.movetop=-this.lheight*(this.aritems.length-2);
	this.divp.style.cssText="position:relative;-webkit-transition: all 0.1s ease-out; transition: all 0.1s ease-out; -webkit-transform: translate3d(0px,"+this.movetop+"px,0px);";
}

cpicker.prototype.fget_selected_obj=function(){
	var i=-(this.movetop/this.lheight)+1;
	return this.divp.children[i];
}

cpicker.prototype.fget_selected_tx=function(){
	return this.fget_selected_obj().innerHTML;
}

/**@ctime_picker===========================================================================================
 * time picker and date picker widget
 * ex:
 * this.otime_picker=new ctime_picker(this.ref+'.otime_picker',this.pref+'time_picker','9:00');
	a["content"]+=this.otime_picker.fcreate();
	this.otime_picker2=new ctime_picker(this.ref+'.otime_picker2',this.pref+'time_picker2',"2014-02-06");
	a["content"]+=this.otime_picker2.fcreate();
 */
function ctime_picker(_ref,_pref,_format,_dte,_duree,_funcok){
	this.ref=_ref;
	this.pref=_pref;
	this.lheight=50;	
	this.dra=false;
	this.actpicker=null;
	this.format=_format;	
	if(_dte)this.dte=_dte;
	if(_funcok)this.funcok=_funcok;
	
	var reg=new RegExp("[- :]+", "g");	
	if(this.format=='time'){
		var dt="08:30";
		if(this.dte)dt=this.dte;
		var adte=dt.split(reg);
		this.paramh={offsetY:0, movetop:(1-(+adte[0]))*this.lheight, offsetTop:0};
		this.paramh.aritems=new Array();
		for(var i=0;i<24;i++)this.paramh.aritems[i]=(i>9)?i:("0"+i);
		
		if(_duree)this.duree=_duree;
		else this.duree=1;
		this.parami={offsetY:0, movetop:(1-(+adte[1])/this.duree)*this.lheight, offsetTop:0};
		this.parami.aritems=new Array();
		for(var i=0;i<60;i+=this.duree)this.parami.aritems[i/this.duree]=(i>9)?i:("0"+i);
	}else if(this.format=='day'){
		var dt=d2my();
		if(this.dte)dt=this.dte;
		var adte=dt.split(reg);
		var yc=new Date().getFullYear();
		if(_duree)this.duree=_duree;
		else this.duree={min:(yc-5),max:(yc+5)};
		this.paramy={offsetY:0, movetop:(1-(+adte[0]-this.duree.min))*this.lheight, offsetTop:0};
		this.paramy.aritems=new Array();
		for(var i=this.duree.min;i<=this.duree.max;i++)this.paramy.aritems[i-this.duree.min]=i;		
		
		this.paramm={offsetY:0, movetop:(1-(+adte[1]-1))*this.lheight, offsetTop:0};
		this.paramm.aritems=new Array();
		this.monthNames = new Array("Jan.","Fév.","Mars","Avr.","Mai","Juin.","Juil.","Août","Sept.","Oct.","Nov.","Déc.");
		for(var i=0;i<12;i++)this.paramm.aritems[i]=this.monthNames[i];
		
		this.paramd={offsetY:0, movetop:(1-(+adte[2]-1))*this.lheight, offsetTop:0};
		this.paramd.aritems=new Array();		
		for(var i=0;i<new Date(+adte[0],+adte[1],0).getDate();i++)this.paramd.aritems[i]=(i>8)?(i+1):("0"+(i+1));
	}
}

ctime_picker.prototype.fcreate=function(compl){
	if(!compl)compl='';
	switch(this.format){
	case "time":
		var tx=text(this.pref+"text",this.pref+"text","readonly='true' onclick='"+this.ref+".fshowbox();' "+compl,this.dte ? this.dte : "");
		break;
	case "day":
		var reg=new RegExp("[- :]+", "g");
		var d="";
		if(this.dte){
			var adte=this.dte.split(reg);
			d=adte[2]+" "+this.monthNames[adte[1]-1]+" "+adte[0];
		}		
		var tx=text(this.pref+"text",this.pref+"text","readonly='true' onclick='"+this.ref+".fshowbox();' "+compl,d);
		break;
	}
	
	return tx;
}

ctime_picker.prototype.fshowbox=function(){
	this.vtarget=document.getElementById(this.pref+"text");
	if(!this.vtarget)return;
	var a=new Array();
	a["tp"]='dialog';
	a["w"]=wwin-30;
	a["h"]=220;
	a["content"]="<div ontouchstart='"+this.ref+".ftouchstart(event)'>";
	//a["content"]="<div onmousedown='"+this.ref+".ftouchstart(event)'>";
	
	switch(this.format){
	case "time":
		a["content"]+="<div id='"+this.pref+"hour' onselectstart='return false' class='pic' style='height:"+this.lheight*3+"px;width:"+(wwin/2-50)+"px;'></div>";
		a["content"]+="<div onselectstart='return false' class='pic' style='pointer-events:none;text-align:center;font-size:20px;height:"+this.lheight*3+"px;line-height:"+this.lheight*3+"px;width:10px;'>:</div>";
		a["content"]+="<div id='"+this.pref+"minute' onselectstart='return false' class='pic' style='height:"+this.lheight*3+"px;width:"+(wwin/2-50)+"px;'></div>";
		break;
	case "day":
		a["content"]+="<div id='"+this.pref+"day' onselectstart='return false' class='pic' style='height:"+this.lheight*3+"px;width:"+(wwin/3-30)+"px;'></div> ";
		a["content"]+="<div id='"+this.pref+"month' onselectstart='return false' class='pic' style='height:"+this.lheight*3+"px;width:"+(wwin/3-30)+"px;'></div>";
		a["content"]+="<div id='"+this.pref+"year' onselectstart='return false' class='pic' style='height:"+this.lheight*3+"px;width:"+(wwin/3-30)+"px;'></div>";
		break;
	}
	
	a["content"]+="</div>";
	a["content"]+="<div style='position:absolute;right:0px;bottom:0px;width:100%;font-size:20px;text-align:center;border-top:1px solid #ccc;'>" +
				  "<div onclick='fback_history();' style='height:"+this.lheight+"px;line-height:"+this.lheight+"px;width:"+(wwin/2-15)+"px;color:red;position:relative;float:left;border-right:1px solid #ccc'>Annuler</div>"+
				  "<div onclick='"+this.ref+".fset_value();fback_history();' style='height:"+this.lheight+"px;line-height:"+this.lheight+"px;width:"+(wwin/2-16)+"px;color:blue;position:relative;float:right;'>Ok</div></div>";
	this.timepicker_dialog=fnew_page(a);
	this.timepicker_dialog.content.style.backgroundColor='#fff';
	this.timepicker_dialog.container.setAttribute('ontouchend',this.ref+".ftouchend(event)");
	this.timepicker_dialog.container.setAttribute('ontouchmove',this.ref+".ftouchmove(event)");
	/*this.timepicker_dialog.container.setAttribute('onmouseup',this.ref+".ftouchend(event)");
	this.timepicker_dialog.container.setAttribute('onmousemove',this.ref+".ftouchmove(event)");*/
	
	switch(this.format){
	case "time":
		this.ohourpicker=new cpicker(this.ref+'.hour',this.pref+'hour',this.paramh, document.getElementById(this.pref+'hour'));
		this.ohourpicker.fcreatehtml();		
		this.ominutepicker=new cpicker(this.ref+'.minute',this.pref+'minute',this.parami, document.getElementById(this.pref+'minute'));
		this.ominutepicker.fcreatehtml();
		break;
		
	case "day":
		this.oyearpicker=new cpicker(this.ref+'.year',this.pref+'year',this.paramy, document.getElementById(this.pref+'year'));
		this.oyearpicker.fcreatehtml();		
		this.omonthpicker=new cpicker(this.ref+'.month',this.pref+'month',this.paramm, document.getElementById(this.pref+'month'));
		this.omonthpicker.fcreatehtml();
		
		var reg=new RegExp("[- :]+", "g");
		var dt=d2my();
		if(this.dte)dt=this.dte;
		var adte=dt.split(reg);
		this.paramd.aritems=new Array();		
		for(var i=0;i<new Date(+adte[0],+adte[1],0).getDate();i++)this.paramd.aritems[i]=(i>8)?(i+1):("0"+(i+1));
		this.odaypicker=new cpicker(this.ref+'.day',this.pref+'day',this.paramd, document.getElementById(this.pref+'day'));
		this.odaypicker.fcreatehtml();
		break;
	}
}

ctime_picker.prototype.ftouchstart=function(e){
	var opic_li=e.target||e.srcElement||e.touches[0].target;
	if(opic_li.className!='pic_li')return false;

	switch(opic_li.parentNode.parentNode.id){
		case this.pref+"hour":
			this.actpicker=this.ohourpicker;
		break;
		case this.pref+"minute":
			this.actpicker=this.ominutepicker;
		break;
		case this.pref+"year":
			this.actpicker=this.oyearpicker;
		break;
		case this.pref+"month":
			this.actpicker=this.omonthpicker;
		break;
		case this.pref+"day":
			this.actpicker=this.odaypicker;
		break;
	}
	this.dra=true;
	this.picktouchstart=new Date();
	this.actpicker.offsetY = e.pageY||e.touches[0].pageY;
	this.actpicker.movetop=-opic_li.offsetTop+this.lheight;
	this.actpicker.divp.style.cssText="position:relative;-webkit-transition: all 0.2s ease-out; transition: all 0.2s ease-out; -webkit-transform: translate3d(0px,"+this.actpicker.movetop+"px, 0px);"		
	this.actpicker.offsetTop=this.actpicker.movetop;
	return false;
}

ctime_picker.prototype.ftouchend=function(e){
	if(!this.dra)return false;
	this.picktouchend=new Date();
	if(this.picktouchend.getTime()-this.picktouchstart.getTime()<200 && Math.abs(this.actpicker.movetop-this.actpicker.offsetTop)>=3.5*this.lheight){			
		if(this.actpicker.movetop-this.actpicker.offsetTop<0)this.actpicker.movetop=(2-this.actpicker.aritems.length)*this.lheight;
		else this.actpicker.movetop=this.lheight;		
		var s=0.1*Math.abs(this.actpicker.movetop-this.actpicker.offsetTop)/this.lheight;	
		if(s>5)s=5;
		this.actpicker.divp.style.cssText="position:relative;-webkit-transition: all "+s+"s ease-out; transition: all "+s+"s ease-out; -webkit-transform: translate3d(0px,"+this.actpicker.movetop+"px, 0px);";
	}else if(this.picktouchend.getTime()-this.picktouchstart.getTime()<300 && Math.abs(this.actpicker.movetop-this.actpicker.offsetTop)>=2*this.lheight){			
		this.actpicker.movetop=Math.round(this.actpicker.movetop/this.lheight)*this.lheight;
		if(this.actpicker.movetop-this.actpicker.offsetTop<0)this.actpicker.movetop=this.actpicker.movetop-4*this.lheight;
		else this.actpicker.movetop=this.actpicker.movetop+4*this.lheight;
		
		if(this.actpicker.movetop<(2-this.actpicker.aritems.length)*this.lheight)this.actpicker.movetop=(2-this.actpicker.aritems.length)*this.lheight;
		else if(this.actpicker.movetop>this.lheight)this.actpicker.movetop=this.lheight;
		this.actpicker.divp.style.cssText="position:relative;-webkit-transition: all .5s ease-out; transition: all .5s ease-out; -webkit-transform: translate3d(0px,"+this.actpicker.movetop+"px, 0px);";
	}else{
		this.actpicker.movetop=Math.round(this.actpicker.movetop/this.lheight)*this.lheight;
		if(this.actpicker.movetop<(2-this.actpicker.aritems.length)*this.lheight)this.actpicker.movetop=(2-this.actpicker.aritems.length)*this.lheight;
		else if(this.actpicker.movetop>this.lheight)this.actpicker.movetop=this.lheight;
		this.actpicker.divp.style.cssText="position:relative;-webkit-transition: all 0.1s ease-out; transition: all 0.1s ease-out; -webkit-transform: translate3d(0px,"+this.actpicker.movetop+"px, 0px);";		
	}

	if(this.format=="day" && (this.actpicker==this.oyearpicker || this.actpicker==this.omonthpicker)){		
		var vy=this.oyearpicker.fget_selected_tx();
		var vm=this.omonthpicker.fget_selected_tx();
		var numd=new Date(+vy,this.monthNames.indexOf(vm)+1,0).getDate();
		this.paramd.aritems=new Array();
		for(var i=0;i<numd;i++)this.paramd.aritems[i]=(i>8)?(i+1):("0"+(i+1));
		this.odaypicker.aritems=this.paramd.aritems;
		this.odaypicker.freset_items();
	}
	this.dra=false;
	return false;
}

ctime_picker.prototype.ftouchmove=function(e){
	e.preventDefault();
	if(!this.dra)return false;
	this.actpicker.movetop=(e.pageY||e.touches[0].pageY)-this.actpicker.offsetY+this.actpicker.offsetTop;
	this.actpicker.divp.style.cssText="position:relative; -webkit-transform: translate3d(0px,"+this.actpicker.movetop+"px, 0px);"
	return false;
}

ctime_picker.prototype.fset_value=function(){
	switch(this.format){
		case "time":
			this.paramh.movetop=this.ohourpicker.movetop;
			this.parami.movetop=this.ominutepicker.movetop;
			var vh=this.ohourpicker.fget_selected_tx();
			var vi=this.ominutepicker.fget_selected_tx();
			this.vtarget.value=vh+":"+vi;
			this.dte=vh+":"+vi;
		break;		
		case "day":
			this.paramy.movetop=this.oyearpicker.movetop;
			this.paramm.movetop=this.omonthpicker.movetop;
			this.paramd.movetop=this.odaypicker.movetop;
			var vy=this.oyearpicker.fget_selected_tx();
			var vm=this.omonthpicker.fget_selected_tx();
			var vd=this.odaypicker.fget_selected_tx();
			this.vtarget.value=vd+" "+vm+" "+vy;
			
			if(this.monthNames.indexOf(vm)<9)var vmm="0"+(this.monthNames.indexOf(vm)+1);
			else var vmm=this.monthNames.indexOf(vm)+1;
			this.dte=vy+"-"+vmm+"-"+vd;		
		break;
	}
	if(this.funcok)eval(this.funcok);
}

ctime_picker.prototype.fset_value_by_date=function(dt){
	this.dte=dt;
	document.getElementById(this.pref+"text").value=dt;
	var reg=new RegExp("[- :]+", "g");	
	if(this.format=='time'){
		var adte=dt.split(reg);
		this.paramh.movetop=(1-(+adte[0]))*this.lheight;
		this.parami.movetop=(1-(+adte[1])/this.duree)*this.lheight;
	}else if(this.format=='day'){
		var adte=dt.split(reg);
		this.paramy.movetop=(1-(+adte[0]-this.duree.min))*this.lheight;		
		this.paramm.movetop=(1-(+adte[1]-1))*this.lheight;		
		this.paramd.movetop=(1-(+adte[2]-1))*this.lheight;
	}
}

/**@cselect================================================================
 * ex:
 * var ar=new Array();
	ar['a']="aaaa";
	ar['b']="bbbb";
	ar['c']="cccc";
	this.scre=new cselect(this.ref+".scre","scre",ar,'c');
	var tx=this.scre.fcreate();
	obj.innerHTML=tx;
 */
function cselect(_ref,_id,_ar,_v,_fonchange){
	this.ref=_ref;
	this.id=_id;
	if(_ar instanceof Array)this.ar=_ar;	
	else this.ar=new Array();
	this.v=_v;

	if(!this.v || !this.ar[this.v]){
		for(var i in this.ar){this.v=i;break;}
	}
	
	if(typeof(_fonchange)!='undefined')this.fonchange=_fonchange;
	else this.fonchange==null;

}

cselect.prototype.fcreate=function(compl, complClass){
	var tx="<div onClick=\""+this.ref+".fshowbox(this)\" class='select "+(complClass ? complClass : '')+ "' "+(compl ? compl : '')+">" +
			"<input type='hidden' id='"+this.id+"' />" +
			"<div id='"+this.id+"ctn'>"+this.ar[this.v]+"</div></div>";
	return tx;
}

cselect.prototype.fshowbox=function(obj){
	var tx="<div style='width:100%;border-top:1px solid #ccc;max-height:"+(hwin/2-10)+"px;overflow-y:scroll;-webkit-overflow-scrolling:touch;'>";
	for(var i in this.ar){
		tx+="<div class='select_item' onClick=\"fback_history();"+this.ref+".fselected('"+i+"');";
		if(this.fonchange)tx+=this.fonchange+"('"+i+"');";
		tx+="\">"+this.ar[i]+"</div>";
	}
	tx+="</div>";
	var w=obj.offsetWidth-5;
	if(w<0.8*wwin)w=0.9*wwin;
	var left=getOffsetPosition(obj,'Left');
	this.cm=fcontext_menu(obj,tx,w,left);
}
cselect.prototype.fselected=function(v){
	this.v=v;
	document.getElementById(this.id).value=v;
	document.getElementById(this.id+'ctn').innerHTML=this.ar[v];
}


/**@cselectajax==================================
 * 
 */
function cselectajax(_ref,_pref,_param){
	this.ref=_ref;
	this.pref=_pref;
	if(!_param)return;
	this.param=_param;
	
	this.v='';
	if(this.param.v)this.v=this.param.v;
	
	this.req=null;
	if(this.param.req)this.req=this.param.req;
	
	this.ofl_req=null;
	if(this.param.ofl_req)this.ofl_req=this.param.ofl_req;
	this.req.rech=this.v;
	
	this.outputs={v1:this.pref};	
	if(this.param.outputs)this.outputs=this.param.outputs;
	
	this.flist_item=null;
	if(this.param.flist_item)this.flist_item=this.param.flist_item;
	
	this.fclick_item=null;
	if(this.param.fclick_item)this.fclick_item=this.param.fclick_item;
	
	this.asupval=null;
	if(this.param.asupval)this.asupval=this.param.asupval;
	
	this.placeholder='';
	if(this.param.placeholder)this.placeholder=this.param.placeholder;

	this.min_len=0;
	if(this.param.min_len)this.min_len=this.param.min_len;
	
	this.search_timer=null;
	
	this.ajaxtool=new Array();
	if(this.param.ajaxtool)this.ajaxtool=this.param.ajaxtool;
	
	
}

cselectajax.prototype.fcreate=function(){
	return text(this.pref,this.pref,"onkeyup=\""+this.ref+".fshowbox(this.parentNode);\" " +
			"onblur=\""+this.ref+".fblur();\" " +
			"onfocus=\""+this.ref+".fshowbox(this.parentNode);\" placeholder=\""+this.placeholder+"\"",this.v);
}

cselectajax.prototype.fblur=function(){
	setTimeout(this.ref+".cm.style.display='none'",100);
}

cselectajax.prototype.fshowbox=function(obj){
	if(!this.cm){	
		var width=obj.offsetWidth;
		if(width<0.6*wwin)width=0.6*wwin;
		var left=getOffsetPosition(obj,'Left');
	
		this.cm=document.createElement('div');
		this.cm.style.cssText="position:absolute;left:"+left+"px;Z-index:3;width:"+width+"px;border-radius:3px;box-shadow:0px 1px 4px 0px #999;";

		obj.parentNode.appendChild(this.cm);
		this.cm.className='pop small';
		this.textbox=obj.firstChild;
	}
	
	if(getOffsetPosition(obj,"Top")<hwin/1.5)var top=getOffsetPosition(obj,"Top")+obj.offsetHeight-40;
	else var btm=hwin-getOffsetPosition(obj,"Top")+40;
	if(top)this.cm.style.top=top+"px";
	else if(btm)this.cm.style.bottom=btm+"px";
	
	this.v=this.textbox.value;
	if(this.search_timer)clearTimeout(this.search_timer);
	this.search_timer=setTimeout(this.ref+".fsearch()",500);
	if(!obj.value)this.cm.style.display='none';
}

cselectajax.prototype.fsearch=function(){
	if(this.req){
		this.req.rech=this.v;
		if(this.v.length<this.min_len)return;
		soap.call(this.req,this.fsearch_clb,this,this.fsearch_ofl_clb);
	}else this.fsearch_ofl_clb(this);
}
cselectajax.prototype.fsearch_clb=function(r,rt,myobj){
	var res=r.selectNodes("./results/result");
	var tx="<div style='border-top:1px solid #ccc;max-height:"+(hwin/2-10)+"px;width:100%;overflow-y:scroll;-webkit-overflow-scrolling:touch;'>";
	for(var i in myobj.asupval){
		tx+="<div class='select_item' onClick=\""+myobj.ref+".fset_values("+myobj.ref+".asupval["+i+"])\">";
		if(myobj.flist_item)tx+=myobj.flist_item(myobj.asupval[i]);
		tx+="</div>";
	}
	myobj.avals=new Array();
	for(var i=0;i<res.length;i++){	
		myobj.avals[i]=xmlattr2array(res[i]);
		tx+="<div class='select_item' onClick=\""+myobj.ref+".fset_values("+myobj.ref+".avals["+i+"])\">";
		if(myobj.flist_item)tx+=myobj.flist_item(myobj.avals[i]);
		tx+="</div>";
	}
	tx+="</div>";
	if(res.length>0 || myobj.asupval){
		myobj.cm.style.display='';
		setTimeout(myobj.ref+".cm.className ='pop transition2 big'",50);	
		myobj.cm.innerHTML=tx;
	}
}

cselectajax.prototype.fsearch_ofl_clb=function(myobj){
	if(!myobj.ofl_req)return;
	odb.query(myobj.ofl_req.replace(/[?]/g,"\""+myobj.v+"%\""),myobj,myobj.fsuccess_get_local_clb)
}

cselectajax.prototype.fsuccess_get_local_clb=function(myobj,p){
	if(!p)p=new Array();
	var tx="<div style='border-top:1px solid #ccc;max-height:"+(hwin/2-10)+"px;width:100%;overflow-y:scroll;-webkit-overflow-scrolling:touch;'>";
	for(var i in myobj.asupval){
		tx+="<div class='select_item' onClick=\""+myobj.ref+".fset_values("+myobj.ref+".asupval["+i+"])\">";
		if(myobj.flist_item)tx+=myobj.flist_item(myobj.asupval[i]);
		tx+="</div>";
	}
	myobj.avals=new Array();
	for(var i=0;i<p.length;i++){	
		myobj.avals[i]=p[i];
		tx+="<div class='select_item' onClick=\""+myobj.ref+".fset_values("+myobj.ref+".avals["+i+"])\">";
		if(myobj.flist_item)tx+=myobj.flist_item(myobj.avals[i]);
		tx+="</div>";
	}
	tx+="</div>";
	if(p.length>0 || myobj.asupval){
		myobj.cm.style.display='';
		setTimeout(myobj.ref+".cm.className ='pop transition2 big'",50);	
		myobj.cm.innerHTML=tx;
	}
}

cselectajax.prototype.fset_values=function(aval){
	if(this.fclick_item)eval(this.fclick_item+"(aval)");
	for(var i in this.outputs){
		document.getElementById(this.outputs[i]).value=aval[i];
	}
}

/**@cmulitselectajax==================================
 * 
 */
function cmultiselectajax(_ref,_pref,_param){
	this.ref=_ref;
	this.pref=_pref;
	if(!_param)return;
	this.param=_param;
	
	this.v='';
	if(this.param.v)this.v=this.param.v;
	
	this.main_key="v1";
	if(this.param.main_key)this.main_key=this.param.main_key;
	
	this.req=null;
	if(this.param.req)this.req=this.param.req;
	this.req.rech=this.v;
	
	this.flist_item=null;
	if(this.param.flist_item)this.flist_item=this.param.flist_item;
	
	this.outputs={v1:this.pref};	
	if(this.param.outputs)this.outputs=this.param.outputs;
	
	this.asupval=null;
	if(this.param.asupval)this.asupval=this.param.asupval;
	
	this.selected_values=new Array();
	if(this.param.selected_values)this.selected_values=this.param.selected_values;
	
	this.placeholder='';
	if(this.param.placeholder)this.placeholder=this.param.placeholder;

	this.min_len=0;
	if(this.param.min_len)this.min_len=this.param.min_len;
	
	this.search_timer=null;
	
	this.ajaxtool=new Array();
	if(this.param.ajaxtool)this.ajaxtool=this.param.ajaxtool;
}

cmultiselectajax.prototype.fcreate=function(){
	var tx="<div class='text' ><div id='"+this.pref+"'>";

	for(var k in this.selected_values){
		var aval=this.selected_values[k];
		for(var i in this.outputs){
			var pnode=document.getElementById(this.outputs[i]);
			if(this.outputs[i]==this.pref){
				tx+="<div style='position:relative;max-length:"+(wwin-120)+"px;overflow:hidden;left:2px;float:left;margin:0px 0px 2px 10px;line-height:30px;background:#eee;border-radius:3px;'>" +
					"<div style='position:relative;float:left;margin-right:30px;'>"+aval[i]+"</div>" +
					"<img onClick=\""+this.ref+".fdelete_value(this,"+aval[this.main_key]+")\" src='img/icon_close.png' " +
					"style='height:30px;position:absolute;right:0;top:0;background:#d5d5d5;border-radius:3px;' /></div>";
			}	
		}
	}
	
	tx+="</div>";
	tx+="<input type='text' placeholder=\""+this.placeholder+"\" onkeyup=\""+this.ref+".fshowbox(this.parentNode);\" " +
	"onblur=\""+this.ref+".fblur();\" onfocus=\""+this.ref+".fshowbox(this.parentNode);\" />";
	tx+="<div class='text_base'></div></div>";
	return tx;
}

cmultiselectajax.prototype.fblur=function(){
	setTimeout(this.ref+".cm.style.display='none'",100);
}

cmultiselectajax.prototype.fshowbox=function(obj){
	if(!this.cm){
		var width=obj.offsetWidth;
		if(width<0.6*wwin)width=0.6*wwin;
		var left=getOffsetPosition(obj,'Left');
	
		this.cm=document.createElement('div');
		this.cm.style.cssText="position:absolute;left:"+left+"px;Z-index:5;width:"+width+"px;border-radius:3px;box-shadow:0px 1px 4px 0px #999;";

		obj.parentNode.appendChild(this.cm);
		this.cm.className='pop small';
		this.textbox=obj.getElementsByTagName("input")[0];
	}
	
	var top=getOffsetPosition(obj,"Top")+obj.offsetHeight-40;
	this.cm.style.top=top+"px";

	this.v=this.textbox.value;
	if(this.search_timer)clearTimeout(this.search_timer);
	this.search_timer=setTimeout(this.ref+".fsearch()",500);
	if(!obj.value)this.cm.style.display='none';
}

cmultiselectajax.prototype.fsearch=function(){
	if(this.req){
		this.req.rech=this.v;
		if(this.v.length<this.min_len)return;
		soap.call(this.req,this.fsearch_clb,this,this.fsearch_ofl_clb);
	}	
}

cmultiselectajax.prototype.fsearch_clb=function(r,rt,myobj){
	var tx="<div style='border-top:1px solid #ccc;max-height:"+(hwin/2-10)+"px;width:100%;overflow-y:scroll;-webkit-overflow-scrolling:touch;'>";
	for(var i in myobj.asupval){
		tx+="<div class='select_item' onClick=\""+myobj.ref+".fset_values("+myobj.ref+".asupval["+i+"])\">";
		if(myobj.flist_item)tx+=myobj.flist_item(myobj.asupval[i]);
		tx+="</div>";
	}
	var res=r.selectNodes("./results/result");
	myobj.avals=new Array();
	for(var i=0;i<res.length;i++){	
		myobj.avals[i]=xmlattr2array(res[i]);
		tx+="<div class='select_item' onClick=\""+myobj.ref+".fset_values("+myobj.ref+".avals["+i+"])\">";
		if(myobj.flist_item)tx+=myobj.flist_item(myobj.avals[i]);
		tx+="</div>";
	}
	tx+="</div>"
	if(res.length>0 || myobj.asupval){
		myobj.cm.style.display='';
		setTimeout(myobj.ref+".cm.className ='pop transition2 big'",50);	
		myobj.cm.innerHTML=tx;
	}
}

cmultiselectajax.prototype.fset_values=function(aval){
	if(this.textbox)this.textbox.value="";
	this.textbox.focus();
	
	if(this.selected_values[aval[this.main_key]])return;
	this.selected_values[aval[this.main_key]]=aval;
	var len=this.selected_values.length;
	
	for(var i in this.outputs){
		var pnode=document.getElementById(this.outputs[i]);
		if(this.outputs[i]==this.pref){
			var delm=document.createElement('div');
			delm.style.cssText="position:relative;max-length:"+(wwin-120)+"px;overflow:hidden;left:2px;float:left;margin:0px 0px 2px 10px;line-height:30px;background:#eee;border-radius:3px;";
			delm.innerHTML="<div style='position:relative;float:left;margin-right:30px;'>"+aval[i]+"</div>" +
						"<img onClick=\""+this.ref+".fdelete_value(this,"+aval[this.main_key]+")\" src='img/icon_close.png' " +
						"style='height:30px;position:absolute;right:0;top:0;background:#d5d5d5;border-radius:3px;' />";
			pnode.appendChild(delm);
		}else{
			var ar=new Array();
			for(var j in this.selected_values)ar.push(this.selected_values[j][i]);
			pnode.value=ar.join(',');
		}		
	}
}

cmultiselectajax.prototype.fdelete_value=function(obj,n){
	obj.parentNode.parentNode.removeChild(obj.parentNode);
	delete this.selected_values[n];
	for(var i in this.outputs){
		if(this.outputs[i]==this.pref)continue;
		var pnode=document.getElementById(this.outputs[i]);
		var ar=new Array();
		for(var j in this.selected_values)ar.push(this.selected_values[j][i]);
		pnode.value=ar.join(',');
	}
}

cmultiselectajax.prototype.fget_main_values=function(){
	var ar=new Array();
	for(var i in this.selected_values)ar.push(this.selected_values[i][this.main_key]);
	return ar.join(',');
}
/**@ctab
 * tab navigation==================================================================
 * ex:	this.main_page=fnew_page(a,'');		
		var paramtab={};
		paramtab.acontent={
				1:{title:"t1",ctn:"p1"},
				2:{title:"t2",ctn:"p2"},
				3:{title:"t3",ctn:"p3"},
				4:{title:"t4",ctn:"p4"}
		}
		this.otab=new ctab(this.ref+".otab",this.pref+"tab",paramtab,this.main_page.content);
		this.otab.fcreate();
 **/
function ctab(_ref,_pref,_param,_htarget){
	this.ref=_ref;
	this.pref=_pref;
	if(typeof(_param)!="undefined"){
		this.param=_param;
		if(typeof(this.param.acontent)=="undefined")this.acontent=null;
		else this.acontent=this.param.acontent;
	}else{
		this.param=null;
		this.acontent=null;
	}
	if(typeof(_htarget)!="undefined")this.htarget=_htarget;
	else this.htarget=null;
}

ctab.prototype.fcreate=function(_htarget){
	if(typeof(_htarget)!="undefined")this.htarget=_htarget;
	if(!this.htarget || !this.acontent)return false;
	
	this.container=document.createElement("div");
	this.container.className="tab";
	
	this.htt=document.createElement("div");
	this.htt.className='title';
	this.container.appendChild(this.htt);
	
	this.hctn=document.createElement("div");
	this.hctn.className='ctn';
	this.container.appendChild(this.hctn);
	
	this.ahtt=new Array();
	this.ahctn=new Array();
	this.size=0;
	for(var i in this.acontent){
		this.ahtt[this.size]=document.createElement("div");
		if(this.size==0)this.ahtt[this.size].className="item selected";
		else this.ahtt[this.size].className="item";
		this.ahtt[this.size].innerHTML=this.acontent[i]["title"];
		this.ahtt[this.size].setAttribute("onclick",this.ref+".fclk_title("+this.size+")");
		this.htt.appendChild(this.ahtt[this.size]);
		
		this.ahctn[this.size]=document.createElement("div");
		this.ahctn[this.size].className="item";
		this.ahctn[this.size].innerHTML=this.acontent[i]["ctn"];
		this.hctn.appendChild(this.ahctn[this.size]);
		this.size++;
	}
	
	this.scrollbar=document.createElement("div");
	this.scrollbar.className='scrollbar';
	this.scrollbar.style.width=100/this.size+"%";
	this.container.appendChild(this.scrollbar);
	
	for(var i=0;i<this.size;i++)this.ahtt[i].style.width=100/this.size+"%";
	this.hctn.style.width=100*this.size+"%";
	for(var i=0;i<this.size;i++)this.ahctn[i].style.width=100/this.size+"%";
	this.htarget.appendChild(this.container);

	/*this.hctn.setAttribute("onmousedown",this.ref+".fdrag_start(event)");
	this.hctn.setAttribute("onmousemove",this.ref+".fdrag(event)");
	this.hctn.setAttribute("onmouseup",this.ref+".fdrag_end(event)");*/
	this.hctn.setAttribute("ontouchstart",this.ref+".fdrag_start(event)");
	this.hctn.setAttribute("ontouchmove",this.ref+".fdrag(event)");
	this.hctn.setAttribute("ontouchend",this.ref+".fdrag_end(event)");
	
	this.dra=false;
	this.offsetLeft=0;
}

ctab.prototype.fclk_title=function(ind){
	this.ahtt[-this.offsetLeft/wwin].className="item";
	this.offsetLeft=-ind*wwin;
	this.ahtt[-this.offsetLeft/wwin].className="item selected";
	this.hctn.className='ctn transition';
	this.scrollbar.className='scrollbar transition';
	this.hctn.style.WebkitTransform="translate3d("+this.offsetLeft+"px, 0, 0)";
	this.scrollbar.style.WebkitTransform="translate3d("+(-this.offsetLeft/this.size)+"px, 0, 0)";
}

ctab.prototype.fdrag_start=function(e){
	if(typeof(oconsole)!="undefined" && oconsole.nav_open)return false;
	e.stopPropagation();
	this.offsetX=e.pageX||e.touches[0].pageX;
	this.offsetY=e.pageY||e.touches[0].pageY;
	this.moveleft=this.offsetLeft;
	//if(this.offsetX<25)return false;
	this.dra=true;
	this.hctn.className='ctn';
	this.scrollbar.className='scrollbar';
	return false;
}

ctab.prototype.fdrag=function(e){
	e.preventDefault();
	if(!this.dra)return false;
	if(Math.abs((e.pageX||e.touches[0].pageX)-this.offsetX)<Math.abs((e.pageY||e.touches[0].pageY)-this.offsetY)*2.5){
		this.dra=false;
		return false;
	}
	this.moveleft=(e.pageX||e.touches[0].pageX)-this.offsetX+this.offsetLeft;
	if(this.moveleft>0)this.moveleft=0;
	else if(this.moveleft<(1-this.size)*this.ahctn[0].offsetWidth)this.moveleft=(1-this.size)*this.ahctn[0].offsetWidth;
	this.hctn.style.WebkitTransform="translate3d("+this.moveleft+"px, 0, 0)";
	this.scrollbar.style.WebkitTransform="translate3d("+(-this.moveleft/this.size)+"px, 0, 0)";
	return false;
}

ctab.prototype.fdrag_end=function(e){
	if(!this.dra)return false;
	this.dra=false;
	this.hctn.className='ctn transition';
	this.ahtt[-this.offsetLeft/wwin].className="item";
	this.scrollbar.className='scrollbar transition';
	if(this.moveleft-this.offsetLeft<-100){	
		this.hctn.style.WebkitTransform="translate3d("+(this.offsetLeft-wwin)+"px, 0, 0)";
		this.scrollbar.style.WebkitTransform="translate3d("+(-this.offsetLeft+wwin)/this.size+"px, 0, 0)";
		this.offsetLeft=this.offsetLeft-wwin;
	}else if(this.moveleft-this.offsetLeft>100){
		this.hctn.style.WebkitTransform="translate3d("+(this.offsetLeft+wwin)+"px, 0, 0)";
		this.scrollbar.style.WebkitTransform="translate3d("+(-this.offsetLeft-wwin)/this.size+"px, 0, 0)";
		this.offsetLeft=this.offsetLeft+wwin;
	}else{
		this.hctn.style.WebkitTransform="translate3d("+this.offsetLeft+"px, 0, 0)";
		this.scrollbar.style.WebkitTransform="translate3d("+(-this.offsetLeft/this.size)+"px, 0, 0)";
	}	
	this.ahtt[-this.offsetLeft/wwin].className="item selected";	
	return false;
}

function inputElement(id, name, compl, value, tp) {
	
	if(typeof(tp)=='undefined')tp='text';
	
	var _tx = "<input type='"+tp+"' ";
	
	if(id)_tx+="id='"+id+"' ";
	if(name)_tx+="name='"+name+"' ";
	if(typeof(value)!="undefined"){
		_tx+="value='"+afficher_txt(value)+"' ";
	}
	
	if(compl)_tx+=compl;
	_tx+=" />";
	
	return _tx;
}

//textbox===================================
function text(id,name,compl,value,tp){
	if(typeof(tp)=='undefined')tp='text';
	var _tx="<div class='text'><input type='"+tp+"' ";
	if(id)_tx+="id='"+id+"' ";
	if(name)_tx+="name='"+name+"' ";
	if(typeof(value)!="undefined"){
	  _tx+="value='"+afficher_txt(value)+"' ";
	}
	
	if(compl)_tx+=compl;
	_tx+=" />";
	_tx+="<div class='text_base'></div></div>";
	return _tx;
}

//textbox===================================
function textarea(id,name,compl,value,editable){
	if(typeof(tp)=='undefined')tp='text';
	if(typeof(editable)=='undefined')editable=true;

	var _tx="<div class='text'><div class='editable_div' "+(editable ? "contenteditable='true'" : "")+" style='width:"+(wwin-40)+"px;' ";
	if(id)_tx+="id='"+id+"' ";
	if(name)_tx+="name='"+name+"' ";
	if(compl)_tx+=compl;
	_tx+=">";
	if(typeof(value)!="undefined")_tx+=value;
	_tx+="</div>";
	_tx+="<div class='text_base'></div></div>";
	return _tx;
}


function hidden(id,name,value){
	if(!value)value=0
	var tx="<input type='hidden' id='"+id+"' name='"+name+"' value='"+value+"' />";
	return tx;
}
//button====================================
function button(id,name,compl,value){
	var _tx="<div class='btn' ";
	if(id)_tx+="id='"+id+"' ";
	if(name)_tx+="name='"+name+"' ";
	if(compl)_tx+=compl;
	_tx+=">";
	if(typeof(value)!="undefined"){
		 _tx+=afficher_txt(value);
	}
	_tx+="</div>";
	return _tx;
}

//tel====================================
function tel_url(val){
	if(!val)return "";
	var tx="<a href='tel:"+ftel_lisible(val)+"'>"+ftel_lisible(val)+"</a>";
	return tx;
}

//mail====================================
function mail_url(val){
	if(!val)return "";
	var tx="<a href=\"mailto:"+val+"\">"+val+"</a>";
	return tx;
}

//map=====================================
function map_url(val){
	if(!val)return "";
	var tx="<a href='#' onclick=\"map_show(\'http://maps.google.com/?q="+val+"\')\">"+val+"</a>";
	return tx;
}
function map_show(url){
	var a=new Array();
	a["tp"]='dialog';
	a["w"]=wwin-40;
	a["h"]=hwin-40;
	a["content"]="<div onClick='fback_history();' " +
			"style=\"background:yellow url('img/icon_close.png') no-repeat center center;" +
			"position:absolute;top:1px;right:-2px;height:63px;width:63px;Z-index:10;\"> </div>";
	a["content"]+="<iframe id='map_iframe' style='order:none;height:100%;width:100%'></iframe>";
	fnew_page(a);
	var map_iframe=document.getElementById("map_iframe");
	map_iframe.src=url+"&output=embed";
}

//checkbox==================================
function checkbox(id,name,checked,txt){
	var tx="<div style='position:relative;height:35px;line-height:35px;width:100%;'><label>";
	if(txt)tx+=txt;
	if(checked==true)tx+="<input type='checkbox' id='"+id+"' name='"+name+"' checked/>";
	else tx+="<input type='checkbox' id='"+id+"' name='"+name+"' />";
	tx+="</label></div>";
	return tx;
}

//redirect to app store
function fgoto_app_store(){	
	if(device=="Android"){
		window.location.href = 'market://details?id=com.ubicentrex.app';
	}else if(device=="iPhone"){
		window.open('https://itunes.apple.com/');
	}
}


