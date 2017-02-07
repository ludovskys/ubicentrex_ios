function cnonlu(_ref,_pref,_oparent){
	this.ref=_ref;
	this.pref=_pref;
	this.oparent=_oparent;
	this.ncli=this.oparent.n;
	
	this.vfltype=0;
	this.vapartir=0;
	
	this.fremplir_nonlu();
}


cnonlu.prototype.fremplir_nonlu=function(){
	fshow_loading();
	var req={
			soapmethod:'nonlu',
			act:'remplir',
			fltype:this.vfltype,
			apartir:this.vapartir,
			n_utilisateur:user.n,
			n_client:this.ncli
		}
	soap.call(req,this.fremplir_nonlu_clb,this);
}

cnonlu.prototype.fremplir_nonlu_clb=function(r,rt,myobj){
	fcancel_loading();
	if(!r)return;
	myobj.an=new Array();
	var xmlmsgs=r.selectNodes('./messages/*');
	var xmlrdvc=r.selectNodes('./rdv/c/*');
	var xmlrdvm=r.selectNodes('./rdv/m/*');
	var xmlrdvu=r.selectNodes('./rdv/u/*');
	var xmlrdvd=r.selectNodes('./rdv/d/*');
	if(xmlmsgs.length+xmlrdvc.length+xmlrdvm.length+xmlrdvu.length+xmlrdvd.length==0){
		myobj.hctn.innerHTML="<div class='titleNonLuNothing'>Aucune donnée répondant à ces critères.</div>";
		return;
	}
	
	var tx="";
	if(myobj.vfltype==0 || myobj.vfltype==3){
		if(xmlmsgs.length>0)tx+="<h3 class='titleNonlu'>Messages</h3>";
		for(var i=0;i<xmlmsgs.length;i++){
			var amsg=xmltag2array(xmlmsgs[i]);
			tx+=myobj.fafficher_un_nonlu('msg',amsg);
		}
	}
	
	if(myobj.vfltype==0 || myobj.vfltype==1 || myobj.vfltype==2){
		if(xmlrdvc.length>0)tx+="<h3 class='titleNonlu'>Créations de rendez-vous</h3>"
		for(var i=0;i<xmlrdvc.length;i++){
			var ardvc=xmltag2array(xmlrdvc[i].selectSingleNode('./new'));
			tx+=myobj.fafficher_un_nonlu('c',ardvc);
		}

		if(xmlrdvm.length>0)tx+="<h3 class='titleNonlu'>Déplacements de rendez-vous</h3>"
		for(var i=0;i<xmlrdvm.length;i++){
			var ardvm=xmltag2array(xmlrdvm[i].selectSingleNode('./new'));
			var ardvold=xmltag2array(xmlrdvm[i].selectSingleNode('./old'));
			tx+=myobj.fafficher_un_nonlu('m',ardvm,ardvold);
		}

		if(xmlrdvu.length>0)tx+="<h3 class='titleNonlu'>Modifications de rendez-vous</h3>"
		for(var i=0;i<xmlrdvu.length;i++){
			var ardvu=xmltag2array(xmlrdvu[i].selectSingleNode('./new'));
			tx+=myobj.fafficher_un_nonlu('u',ardvu)
		}

		if(xmlrdvd.length>0)tx+="<h3 class='titleNonlu'>Annulations de rendez-vous</h3>"
		for(var i=0;i<xmlrdvd.length;i++){
			var ardvd=xmltag2array(xmlrdvd[i].selectSingleNode('./new'));
			tx+=myobj.fafficher_un_nonlu('u',ardvd)
		}
	}
	myobj.hctn.scrollTop=0;
	myobj.hctn.innerHTML=tx;
}

cnonlu.prototype.fafficher_un_nonlu=function(cat,ar,arold){//cat:msg-msg,c-creation rdv,m-deplace rdv,u-update rdv,d-suppr rdv
	this.an.push(ar.n);
	var tx='';
	tx+="<table id='"+this.pref+ar.n+"' class='structure'>";

	var ext='';
	if(ar.nv_client==1)ext+="<span style='color:red;'>(N)</span>";
	if(ar.vis==1)ext+="<span style='color:orange;'>(V)</span>";
	if(ar.objet=='')ar.objet="(Pas de sujet)";
	tx+="<tr><td colspan='2' class='trNonluObjet'><b>"+ext+ar.objet+"</b></td></tr>";
	tx+="<tr><td class='trNonluInfos'>";

	if(cat!='msg'){
		var dtd=my2jd(ar.ddeb);
		var dtf=my2jd(ar.dfin);
		tx+="<b>"+h2my(dtd)+"-"+h2my(dtf)+" "+jd2fr2(dtd)+"<br></b>";
	}
	var dt='';
	var ctn='';
	switch(cat){
		case 'msg':
			dt="écrit par "+ar.ut_nom_usuel;
			ctn=ar.txt;
			break;
		case 'c':
			dt="Effectué par "+ar.nom_usuel_ut;
			if(ar.txt!='') ctn='Remarque : '+ar.txt;
			break;
		case 'm':
			dt="Effectué par "+ar.nom_usuel_ut;
			ctn='Déplacement du '+mytodfr(arold.ddeb) +" au "+mytodfr(ar.ddeb);
			break;
		case 'u':
			dt="Effectué par "+ar.nom_usuel_ut;
			if(ar.txt!='') ctn='Remarque : '+ar.txt;
			break;
		case 'd':
			dt="Effectué par "+ar.nom_usuel_ut;
			if(ar.txt!='') ctn='Raison suppression : '+ar.txt;
			break;

	}

	tx+=dt+" le "+mytodfr(ar.date_creation)+"</td>";
	// checkbox(this.pref+"vad","vis",vis,"Visite à domicile")
	tx+="<td class='trNonluCheckbox'>"+checkbox(this.pref+"vad","vis",false,"", "onClick='"+this.ref+".passer_lu("+ar.n+")'")+"</td></tr>";
	//tx+="<td style='text-align:right;'><input type='checkbox' onClick='"+this.ref+".passer_lu("+ar.n+")' /></td></tr>";
	tx+="<tr><td style='color:#888;font-size:14px;font-style:italic;' colspan='2'>"+ctn+"</td></tr>";
	
	tx+="<table>";
	return tx;
}

cnonlu.prototype.passer_lu=function(n){
	
	var req={
			soapmethod:'workflow',
			act:'lu',
			val:1,
			n_action:n,
			n_utilisateur:user.n,
			n_client:this.ncli
		}
	soap.call(req,this.passer_lu_clb,this);
}

cnonlu.prototype.passer_lu_clb=function(r,rt,myobj){
	if(!r)return;
	var n_act=r.selectSingleNode('./n_action/text()').nodeValue;
	var hnl=document.getElementById(myobj.pref+n_act);
	if(!hnl)return;
	hnl.style.color='grey';
	hnl.getElementsByClassName('trNonluCheckbox')[0].style.visibility='hidden';
	ftoast("Vous avez passé cet élément à lu");
}

cnonlu.prototype.fpasser_tous_lu=function(n){
	fconfirm("Voulez-vous vraiment passer tous les éléments affichés à lu ?",this.ref+".fpasser_tous_lu2("+n+")");
}

cnonlu.prototype.fpasser_tous_lu2=function(n){
	if(!this.an.join(',')){
		ftoast("Pas d'élément affiché, opération abandonnée.");
		return;
	}
	var req={
			soapmethod:'nonlu',
			act:'toutalu',
			ns:this.an.join(','),
			fltype:this.vfltype,
			apartir:this.vapartir,
			n_utilisateur:user.n,
			n_client:this.ncli
		}
	soap.call(req,this.fpasser_tous_lu_clb,this);
}

cnonlu.prototype.fpasser_tous_lu_clb=function(r,rt,myobj){
	if(!r)return;
	ftoast("Tous les éléments affichés sont passé à lu.");
	myobj.hctn.innerHTML="<div style='text-align:center; font-size:12px;'>Pas de non lus répondant à ces critères.</div>";
	myobj.an=new Array();
}

cnonlu.prototype.fnl_filtre=function(obj){
	var tx="<div class='select_item "+(this.vfltype==0 ? "selected":"")+"' onclick=\""+this.ref+".vfltype=0;fback_history();"+this.ref+".fremplir_nonlu();\">Tout</div>";
	tx+="<div class='select_item "+(this.vfltype==1 ? "selected":"")+"' onclick=\""+this.ref+".vfltype=1;fback_history();"+this.ref+".fremplir_nonlu();\">Rendez-vous</div>";
	tx+="<div class='select_item "+(this.vfltype==2 ? "selected":"")+"' onclick=\""+this.ref+".vfltype=2;fback_history();"+this.ref+".fremplir_nonlu();\">Visites à domicile</div>";
	tx+="<div class='select_item "+(this.vfltype==3 ? "selected":"")+"' onclick=\""+this.ref+".vfltype=3;fback_history();"+this.ref+".fremplir_nonlu();\">Messages</div>";
	tx+="<div class='select_item' style='border:0;height:10px;background:#ddd;'></div>";
	tx+="<div class='select_item "+(this.vapartir==0 ? "selected":"")+"' onclick=\""+this.ref+".vapartir=0;fback_history();"+this.ref+".fremplir_nonlu();\">Une semaine</div>";
	tx+="<div class='select_item "+(this.vapartir==1 ? "selected":"")+"' onclick=\""+this.ref+".vapartir=1;fback_history();"+this.ref+".fremplir_nonlu();\">Aujourd'hui</div>";
	tx+="<div class='select_item "+(this.vapartir==2 ? "selected":"")+"' onclick=\""+this.ref+".vapartir=2;fback_history();"+this.ref+".fremplir_nonlu();\">Deux semaines</div>";
	tx+="<div class='select_item "+(this.vapartir==3 ? "selected":"")+"' onclick=\""+this.ref+".vapartir=3;fback_history();"+this.ref+".fremplir_nonlu();\">Trois semaines</div>";
	tx+="<div class='select_item "+(this.vapartir==4 ? "selected":"")+"' onclick=\""+this.ref+".vapartir=4;fback_history();"+this.ref+".fremplir_nonlu();\">Un mois</div>";
	tx+="<div class='select_item "+(this.vapartir==5 ? "selected":"")+"' onclick=\""+this.ref+".vapartir=5;fback_history();"+this.ref+".fremplir_nonlu();\">Deux mois</div>";
	fcontext_menu(obj,tx,wwin*0.6);
}

cnonlu.prototype.fdisplay=function(_target_ctn){
	if(_target_ctn)this.target_ctn=_target_ctn;
	if(!this.target_ctn)return false;

	if(!this.hctn){
		//icon refresh
		this.hrefresh=document.createElement('div');
		this.hrefresh.innerHTML="<img src='img/icon_loading.png' style='-webkit-transition:all .25s ease-out;transition:all .25s ease-out;height:28px;display:none;'/>";
		this.hrefresh.style.cssText="position:absolute;Z-index:-1;top:0;left:0;width:100%;height:30px;line-height:30px;text-align:right;";
		this.target_ctn.appendChild(this.hrefresh);
		this.himg=this.hrefresh.firstChild;
		
		//cadre message
		this.hctn=document.createElement('div');
		this.hctn.id="nl_ctn_"+this.ncli;
		this.hctn.setAttribute("onscroll",this.ref+".fscroll(event)");
		this.hctn.setAttribute("ontouchstart",this.ref+".ftouchstart(event)");
		this.hctn.setAttribute("ontouchmove",this.ref+".ftouchmove(event)");
		this.hctn.setAttribute("ontouchend",this.ref+".ftouchend(event)");
		this.hctn.className='bdiv scr';
		this.target_ctn.appendChild(this.hctn);
	}
}

cnonlu.prototype.fdisplay_header=function(_target_hdr){
	if(_target_hdr)this.target_hdr=_target_hdr;
	if(!this.hhdr){
		//cadre agenda
		this.hhdr=document.createElement('div');
		this.hhdr.id="nl_hdr_"+this.ncli;
		this.hhdr.className='bdiv bdivHeader';
		var tx="<a onClick='"+this.ref+".oparent.oparent.fnav();' class='menu_left'> </a>";

		tx+="<a onClick=\""+this.ref+".fnl_filtre(this);\" class='menu_right menu_right_bookmark'> </a>";
		tx+="<a onClick=\""+this.ref+".fpasser_tous_lu();\" class='menu_right menu_right_check'> </a>";
		this.hhdr.innerHTML=tx;
		this.target_hdr.appendChild(this.hhdr);
		this.hag_select=document.getElementById(this.pref+"ag_select");
	}
}

cnonlu.prototype.fscroll=function(e){
	if(this.hctn.scrollTop<=0){
		e.preventDefault();
		return false;
	}	
	this.allow_refresh=false;
}

cnonlu.prototype.ftouchstart=function(e){
	this.hctn.className='bdiv scr';
	this.hctn.style.WebkitTransform="translate3d(0,0,0)";
	this.himg.style.WebkitTransform="rotate(0deg)";
	if(this.hctn.scrollTop<=0)this.allow_refresh=true;
	else this.allow_refresh=false;
	
	this.movetop=0;
	this.offsetY=e.touches[0].pageY;
	this.offsetX=e.touches[0].pageX;
	return false;
}

cnonlu.prototype.ftouchmove=function(e){
	if(!this.allow_refresh)return false;
	this.movetop=(e.touches[0].pageY-this.offsetY)/4;
	if(this.movetop<=0 || Math.abs(e.touches[0].pageY-this.offsetY)<=2*Math.abs(e.touches[0].pageX-this.offsetX)){
		this.allow_refresh=false;
		this.hctn.className='bdiv scr transition';
		this.hctn.style.WebkitTransform="translate3d(0,0,0)";
		this.himg.style.WebkitTransform="rotate(0deg)";
		return false;
	}
	e.preventDefault();
	this.himg.style.display='';
	if(this.movetop>80)this.movetop=80;
	this.hctn.style.WebkitTransform="translate3d(0,"+this.movetop+"px,0)";
	
	var deg=Math.ceil(this.movetop/80*180);
	this.himg.style.WebkitTransform="rotate("+deg+"deg)";
	return false;
}

cnonlu.prototype.ftouchend=function(e){
	this.himg.style.display='none';
	if(!this.allow_refresh)return false;
	this.hctn.className='bdiv scr transition';
	this.hctn.style.WebkitTransform="translate3d(0,0,0)";
	this.himg.style.WebkitTransform="rotate(0deg)";
	this.allow_refresh=false;
	if(this.movetop>=50){
		fshow_loading();
		this.fremplir_nonlu();
	}
	return false;
}

cnonlu.prototype.fshow=function(_aff){
	this.hctn.style.display='';
	this.hhdr.style.display='';
	this.hrefresh.style.display='';
}

cnonlu.prototype.fhide=function(){
	this.hctn.style.display='none';
	this.hhdr.style.display='none';
	this.hrefresh.style.display='none';
}
