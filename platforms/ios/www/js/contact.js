function ccontact(_ref,_pref,_oparent){
	this.ref=_ref;
	this.pref=_pref;
	this.oparent=_oparent;
	this.ncli=this.oparent.n;
	this.nsoc=this.oparent.nsoc;
	this.nsoc0=this.oparent.nsoc0;
	
	this.acontacts_sync=new Array();
	this.acontacts=new Array();
	
	this.otelnum = new telnum(this.ref, this.pref, this.oparent);
}

ccontact.prototype.finitial=function(){
	fshow_loading();
	this.last_sync=this.oparent.local_config.con_last_sync;
	this.allow_update_last_sync=true;
	this.from=0;
	
	if(this.last_sync!=0){
		this.initial=0;
		this.fnav_alph('A');
	}else{
		this.initial=1;
		this.fnav_alph('A');
		ftoast("La première synchronisation de contacts peut prendre quelques minutes, veuillez patienter...",5000);
		this.fsync_contacts();
	}
}

ccontact.prototype.fget_local_contacts=function(ch){
	
	var qry="select * from ncb_sys_contacts where n_sys_contact_pere="+this.ncli;
	
	if(ch)qry+=" and nom_usuel like \""+ch+"%\"";
	qry+=" order by nom_usuel limit 0, 5000";
	odb.query(qry,this,this.fsuccess_get_contacts_clb,null,"array");
}

ccontact.prototype.fsuccess_get_contacts_clb=function(myobj,p){
	
	if (p) {
		
		for(var i in p){
			
			var acontact=p[i];
			
			myobj.acontacts[acontact.n]=acontact;
		}
		
		myobj.fget_contacts_tel();
		
	} else {
		
		if (!myobj.fsync_timer) myobj.fsync_contacts();
		else fcancel_loading();

	}
}

ccontact.prototype.fget_contacts_tel=function() {
	
	// Requête pour récupérer les numéros de téléphones
	var qry = "select * from ncb_sys_contacts_tel where nsoc="+this.nsoc;
	odb.query(qry,this,this.fsuccess_get_contacts_tel_clb,null,"array");
	
}

ccontact.prototype.fsuccess_get_contacts_tel_clb=function(myobj,p){
	
	// Boucle numéro de téléphones
	for (var i in p) {
		
		var telnum = p[i];
		
		var acontactTemp = myobj.acontacts[telnum.nco];
		
		if (acontactTemp) {
			
			if (telnum.des == "T. Privé") {
				
				acontactTemp.tpri = telnum.val;
				
			} else if (telnum.des == "T. Mobile") {
				
				acontactTemp.tmobile = telnum.val;
				
			} else if (telnum.des == "T. Prof") {
				
				acontactTemp.tprof = telnum.val;
				
			} else if (telnum.des == "T. ADSL") {
				
				acontactTemp.tadsl = telnum.val;
				
			}
			
			myobj.acontacts[telnum.nco] = acontactTemp;
		}
	}
	
	for(var i in myobj.acontacts){
		
		var acontact=myobj.acontacts[i];
		
		myobj.fafficher_un_contact(acontact);
		
	}
	
	if(!myobj.fsync_timer)myobj.fsync_contacts();
	else fcancel_loading();
}


ccontact.prototype.fsync_contacts=function(){
	console.log("!=============contact sync");
	var req={
			soapmethod:'contact',
			act:'mobile_sync',
			ncli:this.ncli,
			from:this.from,
			initial:this.initial,
			last_sync:this.last_sync
		}

	if(this.fsync_timer)clearTimeout(this.fsync_timer);
	soap.call(req,this.fsync_contacts_clb,this);
}

ccontact.prototype.fafficher_contacts = function() {
	
	
	
}

ccontact.prototype.fsync_contacts_clb=function(r,rt,myobj){
	if(!r)return false;
	var xcontact=r.selectNodes("./rows/row");
	for(var i in xcontact){
		var acontact=xmltag2array(xcontact[i]);
		if(acontact.n_sys_contact_pere!=myobj.ncli)continue;//si partager contacts d'un autre personne on va les ignorer
		//myobj.fafficher_un_contact(acontact);
		myobj.acontacts_sync.push(acontact);
		myobj.acontacts[acontact.n]=acontact;
	}

	if(xcontact.length<3000){
		var qry=new Array();
		if(myobj.initial){
			ftoast("Fin de synchronisation",5000);
			qry.push("delete from ncb_sys_contacts where n_sys_contact_pere="+myobj.ncli);
		}
		
		for(var i in myobj.acontacts_sync){
			var acontact=myobj.acontacts_sync[i];
			qry.push(insert_qry("ncb_sys_contacts",acontact,true));
		}
		
		myobj.last_sync=r.selectSingleNode("./dteqry/@dteqry").nodeValue;
		if(myobj.allow_update_last_sync){			
			qry.push("update ncb_local_config set con_last_sync='"+myobj.last_sync+"' where ncli="+myobj.ncli);
			myobj.allow_update_last_sync=false;
		}		
		odb.query(qry,myobj);
		
		var interval=myobj.oparent.local_config.interval_con;
		myobj.fsync_timer=setTimeout(myobj.ref+".fsync_contacts()",interval*60*1000);
		
		//vider les tableaux et reinisaliser les params pour la prochaine sync
		myobj.initial=0;
		myobj.from=0;
		myobj.acontacts_sync=new Array();
		setTimeout("fcancel_loading()",2000);
	}else{
		myobj.from=myobj.from + xcontact.length;
		myobj.fsync_timer=setTimeout(myobj.ref+".fsync_contacts()",3000);
	}
	
	myobj.otelnum.fsync_telnums();
}

ccontact.prototype.fresync=function(){
	fshow_loading();
	ftoast("Resynchronisation de contacts en cours, cela peut prendre quelques minutes, veuillez patienter...",5000);
	this.acontacts=new Array();
	this.last_sync=0;
	this.allow_update_last_sync=true;
	this.from=0;
	this.initial=1;
	this.fsync_contacts();
}

ccontact.prototype.fafficher_un_contact=function(acontact){
	var id=this.pref+acontact.n;
	var dc=document.createElement("table");
	dc.id=id;
	dc.style.cssText="position:relative;top:0;left:0;width:100%;border-bottom:1px solid #e5e5e5;";
	var imbcg="img/user.png";
	if(acontact.civilite=='Mlle' || acontact.civilite=='Mme')imbcg="img/user_woman.png";
	var tx="<tr><td rowspan='2' onClick=\""+this.ref+".fshow_detail_contact("+acontact.n+");\" style=\"width:45px;min-width:45px;height:45px;background:url('"+imbcg+"') no-repeat center center;background-size:100% 100%;background-color:#e5e5e5;\"></td>";
	tx+="<td style='font-weight:bold;overflow:hidden;max-width:"+(wwin-100)+"px;'>"+acontact.nom_usuel+"</td></tr>";
	var tel=acontact.tmobile;
	if(!tel)tel=acontact.tprof;
	if(!tel)tel=acontact.tpri;
	tx+="<tr><td style='font-size:14px;'>"+tel_url(tel)+"</td></tr>";
	dc.innerHTML=tx;
	var c=acontact.nom_usuel.charAt(0).toUpperCase();
	if(this.adivs[c]){
		var old_dc=this.adivs[c].querySelector('#'+id);
		if(old_dc)this.adivs[c].replaceChild(dc,old_dc);		
		else if(this.adivs[c].childNodes.length>600)return;
		else this.adivs[c].appendChild(dc);
	}
}

ccontact.prototype.fopen_contact=function(n){
	var acon=null;
	if(n && this.acontacts[n])acon=this.acontacts[n];
	var a=new Array();
	a["header"]="<a onClick=\"fback_history();\" class='menu_left' style=\"background:url('img/arrow_carrot-left.png') no-repeat left center\"> </a>";
	a["header"]+="<a onClick=\""+this.ref+".fsave("+n+");\" class='menu_right' style=\"background:url('img/icon_check.png') no-repeat center center;background-size:23px auto;\"> </a>";
	
	this.editpage=fnew_page(a,'right');

	var paramtab={};
	var tx1="<table class='struct' style='position:relative;top:-6px;'>";
	var ar=new Array();
	ar[" "]="-";
	ar['M.']="M.";
	ar['Mme']="Mme";
	ar['Mlle']="Mlle";
	ar['Dr.']="Dr.";
	ar['Pr']="Pr.";
	ar['Me']="Me";
	ar['Enfant']="Enfant";
	ar['Ado']="Ado";
	this.oscivi=new cselect(this.ref+".oscivi",this.pref+"scivi",ar,(acon && acon.civilite) ? acon.civilite : " ");
	tx1+="<tr><td style='width:50px;'>"+this.oscivi.fcreate("style='margin-top:-9px;'")+"</td><td>"+
		text(this.pref+"nom",'',"placeholder='Nom'",(acon && acon.nom) ? acon.nom : "")+"</td><td>"+
		text(this.pref+"prenom",'',"placeholder='Prenom'",(acon && acon.prenom) ? acon.prenom : "")+"</td></tr>";
	
	var yc=new Date().getFullYear();
	var duree={min:(yc-120),max:(yc)};
	this.odnspicker=new ctime_picker(this.ref+'.odnspicker',this.pref+'dnspicker','day',(acon && acon.dte_naissance) ? acon.dte_naissance : "",duree);
	tx1+="<tr><td colspan='2'>"+text(this.pref+"med",'',"placeholder='Méd. traitant'",(acon && acon.med_traitant) ? acon.med_traitant : "")+
		"</td><td>"+this.odnspicker.fcreate("placeholder='Date naissance'")+"</td></tr>";
	tx1+="<tr><td colspan='3'>"+text(this.pref+"societe",'',"placeholder='Societe'",(acon && acon.societe) ? acon.societe : "")+"</td></tr>";
	tx1+="<tr><td colspan='3'>"+text(this.pref+"nss",'',"placeholder='No. secu'",(acon && acon.nss) ? acon.nss : "")+"</td></tr>";
	tx1+="<tr><td colspan='3'>"+text(this.pref+"mail1",'',"placeholder='Emails'",(acon && acon.mail1) ? acon.mail1 : "")+"</td></tr>";
	tx1+="<tr><td colspan='3'>"+text(this.pref+"tel_mobile",'',"placeholder='Tel. mobile'",(acon && acon.tmobile) ? ftel_lisible(acon.tmobile) : "")+"</td></tr>";
	tx1+="<tr><td colspan='3'>"+text(this.pref+"tel_pro",'',"placeholder='Tel. pro'",(acon && acon.tprof) ? ftel_lisible(acon.tprof) : "")+"</td></tr>";
	tx1+="<tr><td colspan='3'>"+text(this.pref+"tel_pri",'',"placeholder='Tel. pri'",(acon && acon.tpri) ? ftel_lisible(acon.tpri) : "")+"</td></tr>";
	tx1+="<tr><td colspan='3'>"+textarea(this.pref+"note",'',"placeholder='note'",(acon && acon.remarque) ? acon.remarque : "")+"</td></tr>";
	tx1+="</table>"
	
	var tx2="<table class='struct'>";
	tx2+="<tr><td colspan='3'>"+text(this.pref+"prodes",'',"placeholder=\"Désignation d'adresse\"",(acon && acon.adresses && acon.adresses[0]) ? acon.adresses[0].des : "Adresse")+"</td></tr>";
	tx2+="<tr><td colspan='3'>"+text(this.pref+"proadr1",'',"placeholder='Adresse 1'",(acon && acon.adresses && acon.adresses[0]) ? acon.adresses[0].adresse_1 : "")+"</td></tr>";
	tx2+="<tr><td colspan='3'>"+text(this.pref+"proadr2",'',"placeholder='Adresse 2'",(acon && acon.adresses && acon.adresses[0]) ? acon.adresses[0].adresse_2 : "")+"</td></tr>";
	tx2+="<tr><td colspan='3'>"+text(this.pref+"proadr3",'',"placeholder='Adresse compl.'",(acon && acon.adresses && acon.adresses[0]) ? acon.adresses[0].adresse_compl : "")+"</td></tr>";
	tx2+="<tr><td>"+text(this.pref+"procp",'',"placeholder='Code postal'",(acon && acon.adresses && acon.adresses[0]) ? acon.adresses[0].cp : "")+"</td><td>"+
			text(this.pref+"proville",'',"placeholder='Ville'",(acon && acon.adresses && acon.adresses[0]) ? acon.adresses[0].ville : "")+"</td></tr>";
	tx2+="<tr><td colspan='3'>"+text(this.pref+"propays",'',"placeholder='Pays'",(acon && acon.adresses && acon.adresses[0]) ? acon.adresses[0].pays : "")+"</td></tr>";
	tx2+="</table>";
		
	var tx3="<table class='struct'>";
	tx3+="<tr><td colspan='3'>"+text(this.pref+"site_web",'',"placeholder='Site web'",(acon && acon.site_web) ? acon.site_web : "")+"</td></tr>";
	tx3+="<tr><td colspan='3'>"+text(this.pref+"rmq1",'',"placeholder='Remarque'",(acon && acon.param1) ? acon.param1 : "")+"</td></tr>";
	tx3+="<tr><td colspan='3'>"+text(this.pref+"rmq2",'',"placeholder='Remarque'",(acon && acon.param2) ? acon.param2 : "")+"</td></tr>";
	tx3+="<tr><td colspan='3'>"+textarea(this.pref+"rmq3",'',"placeholder='Remarque'",(acon && acon.param3) ? acon.param3 : "")+"</td></tr>";
	tx3+="<tr><td colspan='3'>"+textarea(this.pref+"rmq4",'',"placeholder='Remarque'",(acon && acon.param4) ? acon.param4 : "")+"</td></tr>";
	tx3+="<tr><td colspan='3'>"+textarea(this.pref+"rmq5",'',"placeholder='Remarque'",(acon && acon.param5) ? acon.param5 : "")+"</td></tr>";
	tx3+="<tr><td colspan='3'>"+text(this.pref+"famille",'',"placeholder='Famille'",(acon && acon.nfam_nom_usuel) ? acon.nfam_nom_usuel : "")+"</td></tr>";
	tx3+="</table>";
	paramtab.acontent={
			1:{title:"Général",ctn:tx1},
			2:{title:"Adresses",ctn:tx2},
			3:{title:"Détail",ctn:tx3}
	}
	this.otab=new ctab(this.ref+".otab",this.pref+"tab",paramtab,this.editpage.content);
	this.otab.fcreate();
}

ccontact.prototype.fsave=function(n){
	var req={};
	req.soapmethod='contact';
	req.act='save';
	req.ncli=this.ncli;
	if(n)req.n=n;

	//general
	req.civilite=this.oscivi.v;
	req.nom=document.getElementById(this.pref+"nom").value;
	req.prenom=document.getElementById(this.pref+"prenom").value;
	req.societe=document.getElementById(this.pref+"societe").value;
	req.dte_naissance=this.odnspicker.dte;
	req.nss=document.getElementById(this.pref+"nss").value;
	req.med_traitant=document.getElementById(this.pref+"med").value;
	req.mail1=document.getElementById(this.pref+"mail1").value;
	req.remarque=document.getElementById(this.pref+"note").innerHTML;
	req.tel_mobile=document.getElementById(this.pref+"tel_mobile").value;
	req.tel_pro=document.getElementById(this.pref+"tel_pro").value;
	req.tel_pri=document.getElementById(this.pref+"tel_pri").value;

	//détail
	req.site_web=document.getElementById(this.pref+"site_web").value;
	req.param1=document.getElementById(this.pref+"rmq1").value;
	req.param2=document.getElementById(this.pref+"rmq2").value;
	req.param3=document.getElementById(this.pref+"rmq3").innerHTML;
	req.param4=document.getElementById(this.pref+"rmq4").innerHTML;
	req.param5=document.getElementById(this.pref+"rmq5").innerHTML;
	req.nfam_nom_usuel=document.getElementById(this.pref+"famille").value;
    
    // Téléphones (v2)
    req.atel = {};
    
    var nbTel = 1;
    
    if (req.tel_mobile) {
        var atelMobile = {};
        atelMobile.bdef = nbTel;
        atelMobile.des = "T. Mobile";
        atelMobile.ordre = nbTel;
        atelMobile.val = req.tel_mobile;
        
        req.atel[nbTel] = atelMobile;
        
        nbTel++;
    }
    
    if (req.tel_pro) {
        var atelPro = {};
        atelPro.bdef = nbTel;
        atelPro.des = "T. Prof";
        atelPro.ordre = nbTel;
        atelPro.val = req.tel_pro;
        
        req.atel[nbTel] = atelPro;
        
        nbTel++;
    }
    
    if (req.tel_pri) {
        var atelPri = {};
        atelPri.bdef = nbTel;
        atelPri.des = "T. Privé";
        atelPri.ordre = nbTel;
        atelPri.val = req.tel_pri;
        
        req.atel[nbTel] = atelPri;
        
        nbTel++;
    }
	
	//adresses
	req.adresses={};
	var adr1={};
	adr1.des=document.getElementById(this.pref+"prodes").value;
	adr1.adresse_1=document.getElementById(this.pref+"proadr1").value;
	adr1.adresse_2=document.getElementById(this.pref+"proadr2").value;
	adr1.adresse_compl=document.getElementById(this.pref+"proadr3").value;
	adr1.cp=document.getElementById(this.pref+"procp").value;
	adr1.ville=document.getElementById(this.pref+"proville").value;
	adr1.pays=document.getElementById(this.pref+"propays").value;
	if(!n){//creation	
		adr1.n='new';
		req.adresses['new']=adr1;
	}else{//modification
		var acon=this.acontacts[n];
		if(acon.adresses && acon.adresses[0]){
			adr1.n=acon.adresses[0].n;
			req.adresses['n0']=adr1;
		}else{
			adr1.n='new';
			req.adresses['new']=adr1;
		}
	}
	soap.call(req, this.fsave_clb, this);
}

ccontact.prototype.fsave_clb=function(r,rt,myobj){
	if(!r)return;
	fback_history('');
	fshow_loading();
	ftoast("Le contact est enregistré.")
	myobj.fsync_contacts();
}

ccontact.prototype.fshow_search_contact=function(aval){
	this.act_contact=new Array();
	this.act_contact.n=aval.v2;
	var req={
			"soapmethod":"contact",
			"act":"display",
			"nsoc":this.nsoc,
			"ncli":this.ncli,
			"nco":aval.v2
		}
	soap.call(req,this.fshow_detail_contact_clb,this,this.fshow_search_contact_ofl_clb);
}

ccontact.prototype.fshow_search_contact_ofl_clb=function(myobj){
	var qry="select * from ncb_sys_contacts where n="+myobj.act_contact.n;
	odb.query(qry,myobj,myobj.fsuccess_get_contact_ofl_clb,null,"arraysimple");
}

ccontact.prototype.fsuccess_get_contact_ofl_clb=function(myobj,p){
	myobj.acontacts[p.n]=p;
	myobj.act_contact=p;
	myobj.fshow_detail_contact(p.n);
}

ccontact.prototype.fshow_detail_contact=function(n){
	this.act_contact=this.acontacts[n];
	if(typeof(this.act_contact["remarque"])=='undefined'){
		var req={
			"soapmethod":"contact",
			"act":"display",
			"nsoc":this.nsoc,
			"ncli":this.ncli,
			"nco":this.act_contact.n
		}
		soap.call(req,this.fshow_detail_contact_clb,this,this.fshow_detail_contact_ofl_clb);
	}else this.fshow_detail_contact2(this.act_contact)
}

ccontact.prototype.fshow_detail_contact_clb=function(r,rt,myobj){
	if(!r)return false;
	var xcontact=r.selectSingleNode("./contact");
	var acon=xmltag2array(xcontact);
	var xadr=xcontact.selectNodes("./adresses/*");
	if(xadr){
		acon.adresses=new Array();
		for(var i=0;i<xadr.length;i++){
			var adr=xmltag2array(xadr[i]);
			if(adr.adresse_1 || adr.ville || adr.pays)acon.adresses.push(adr);
		}
	}
	acon=array_merge(myobj.act_contact,acon);
	myobj.fshow_detail_contact2(acon);
	myobj.acontacts[acon.n]=acon;
}

ccontact.prototype.fshow_detail_contact_ofl_clb=function(myobj){
	myobj.fshow_detail_contact2(myobj.act_contact);
}

ccontact.prototype.fshow_detail_contact2=function(acontact){
	var a=new Array();
	a["tp"]='dialog';
	a["w"]=wwin;
	a["h"]=hwin*0.6;
	a["pos"]="bottom";
	a["corner"]=false;
	var tx="<div class='bdiv'>";
	tx="<div style='position:relative;width:100%;height:40px;top:0;left:0;background:#eee;'>";
	tx+="<a class='menu_left' style=\"background:url('img/icon_trash_alt.png') no-repeat center center;background-size:23px auto;\"> </a>";
	tx+="<a class='menu_left' onClick=\"fback_history();"+this.ref+".fopen_contact('"+acontact.n+"');\" style=\"left:40px;background:url('img/icon_pencil-edit.png') no-repeat center center;background-size:23px auto;\"> </a>";
	tx+="<a class='menu_right' onClick='fback_history();' style=\"background:url('img/arrow_carrot-down.png') no-repeat center center\"> </a>";
	tx+="</div>"
	tx+="<div style='position:relative;width:100%;top:0;bottom:0;left:0;font-size:17px;overflow-y:scroll;-webkit-overflow-scrolling: touch;'>";
	tx+="<div style='font-size:20px;font-weight:bold;'>"+acontact.nom_usuel+"</div>";
	if(acontact.dte_naissance)tx+="<div>Né(e) le : "+mytodfr(acontact.dte_naissance)+"</div>";
	if(acontact.nss)tx+="<div>No. secu : "+acontact.nss+"</div>";
	if(acontact.tmobile)tx+="<div>Tél. mobile : "+tel_url(acontact.tmobile)+"</div>";
	if(acontact.tprof)tx+="<div>Tél. pro. : "+tel_url(acontact.tprof)+"</div>";
	if(acontact.tpri)tx+="<div>Tél pri. : "+tel_url(acontact.tpri)+"</div>";
	if(acontact.mail1)tx+="<div>Email(s) : "+mail_url(acontact.mail1)+"</div>";
	if(acontact.catdes)tx+="<div>Catégories : "+acontact.catdes+"</div>";
	
	if(acontact.adresses){
		for(var i in acontact.adresses){
			var adr=acontact.adresses[i];
			var txadr=(adr.adresse_1 ? (adr.adresse_1+", ") : "")+
			(adr.adresse_2 ? (adr.adresse_2+", ") : "")+(adr.adresse_compl ? (adr.adresse_compl+", ") : "")+
			(+adr.cp ? (+adr.cp+", ") : "")+(adr.ville ? (adr.ville+", ") : "")+(adr.pays ? (adr.pays+", ") : "");
			txadr=trim(txadr.substr(0,txadr.length-2));
			if(txadr)tx+="<div>"+(adr.des ? adr.des : "Adresse")+" : "+map_url(txadr)+"</div>";
		}
	}
	
	if(acontact.remarque)tx+="<div>Note : "+acontact.remarque+"</div>";
	tx+="</div>";
	tx+="</div>";
	a["content"]=tx;
	fnew_page(a);
}

ccontact.prototype.fdisplay=function(_target_ctn){
	if(_target_ctn)this.target_ctn=_target_ctn;
	if(!this.target_ctn)return false;

	if(!this.hctn){
		//cadre agenda
		this.hctn=document.createElement('div');
		this.hctn.id="con_ctn_"+this.ncli;
		this.hctn.className='bdiv';
		this.target_ctn.appendChild(this.hctn);

		var pajax=new Array();
		pajax.placeholder="Chercher un contact";
		pajax.min_len=2;

		pajax.req={
	    	soapmethod : 'sql',
	        idqry : 'contact',
	        ncli : this.ncli
	    }
		
		pajax.ofl_req="select nom_usuel as v1,n as v2, " +
				"CASE WHEN tel_mobile!='' THEN tel_mobile ELSE (CASE WHEN tel_pri!='' THEN tel_pri ELSE tel_pro END) END as v3 from ncb_sys_contacts " +
				"where n_sys_contact_pere="+this.ncli+" and (nom like ? or prenom like ? or nom_usuel like ?) limit 0,15";
		pajax.flist_item=function(aval){
			var tx="<img style='height:26px;width:auto;margin:6px;position:relative;top:0;left:0;float:left;' src='img/icon_user.png' />";
			tx+="<div style='height:25px;line-height:25px;font-size:16px;position:relative;top:0;left:0;'>"+aval.v1+"</div>";
			tx+="<div style='height:15px;line-height:15px;font-size:13px;position:relative;top:0;left:0;'>"+tel_url(aval.v3)+"</div>";
			return tx;
		}
		pajax.fclick_item=this.ref+".fshow_search_contact";
		pajax.outputs={
			v1:	this.pref+"ocon_selecta"
		}	
		this.ocon_selecta=new cselectajax(this.ref+".ocon_selecta",this.pref+"ocon_selecta",pajax);	
		var tx="<table class='struct style='height:100%;'>";
		tx+="<tr><td>"+this.ocon_selecta.fcreate()+"</td></tr>";
		tx+="<tr><td id='"+this.pref+"hlist'></td></tr>";
		tx+="</table>";
		this.hctn.innerHTML=tx;
		this.hlist=document.getElementById(this.pref+"hlist");
		
		//cadre contact
		this.nav=document.createElement('div');
		this.nav.style.cssText="position:absolute;right:0px;width:45px;top:50px;font-size:11px;border-radius:3px;color:#eee;";
		this.nav.setAttribute("ontouchstart",this.ref+".ftouch_nav_start(event)");
		this.nav.setAttribute("ontouchmove",this.ref+".ftouch_nav_move(event)");
		this.nav.setAttribute("ontouchend",this.ref+".ftouch_nav_end()");
		this.alph="ABCDEFGHIJKLMNOPQRSTUVWXYZ#";
		tx="";
		this.neht=(this.target_ctn.offsetHeight-50)/27;
		
		this.adivs=new Array();
		for(var i=0;i<27;i++){
			var c=this.alph.charAt(i);
			this.adivs[c]=document.createElement('div');
			this.adivs[c].style.cssText="height:"+(hwin-100)+"px;white-space:nowrap;overflow-y:scroll;-webkit-overflow-scrolling: touch;";		
			tx+="<div id='"+this.pref+"alph_"+c+"' style='text-align:center;background:#555;height:"+this.neht+"px;line-height:"+this.neht+"px;margin-left:20px;width:15px;'>"+c+"</div>";
		}
		this.nav.innerHTML=tx;
		this.target_ctn.appendChild(this.nav);
	}
}

ccontact.prototype.ftouch_nav_start=function(e){
	if(!e)e=window.event;
	this.tmpi=Math.floor((e.touches[0].pageY-90)/this.neht);
	var c=this.alph.charAt(this.tmpi);
	document.getElementById(this.pref+"alph_"+this.act_alph).style.background='#555';
	document.getElementById(this.pref+"alph_"+c).style.background='#FF3399';
}
ccontact.prototype.ftouch_nav_move=function(e){
	e.preventDefault();
	e.stopPropagation();
	var i=Math.floor((e.touches[0].pageY-90)/this.neht);
	if(i<0 || i>26 || this.tmpi==i)return;
	var c=this.alph.charAt(this.tmpi);
	document.getElementById(this.pref+"alph_"+c).style.background='#555';
	c=this.alph.charAt(i);
	document.getElementById(this.pref+"alph_"+c).style.background='#FF3399';
	this.tmpi=i;
}

ccontact.prototype.ftouch_nav_end=function(e){
	var c=this.alph.charAt(this.tmpi);
	this.fnav_alph(c);
}

ccontact.prototype.fnav_alph=function(c){
	if(!this.adivs[c] || this.act_alph==c)return;
	if(this.act_alph && this.adivs[this.act_alph]){
		this.hlist.removeChild(this.adivs[this.act_alph]);
		document.getElementById(this.pref+"alph_"+this.act_alph).style.background='#555';
	}
	this.act_alph=c;
	this.hlist.appendChild(this.adivs[c]);
	document.getElementById(this.pref+"alph_"+c).style.background='#FF3399';
	this.hctn.scrollTop=0;

	if(this.adivs[c].childNodes.length==0 && !this.initial){
		fshow_loading();
		this.fget_local_contacts(c);
	}
}

ccontact.prototype.fdisplay_header=function(_target_hdr){
	if(_target_hdr)this.target_hdr=_target_hdr;
	if(!this.hhdr){
		//cadre agenda
		this.hhdr=document.createElement('div');
		this.hhdr.id="msg_hdr_"+this.ncli;
		this.hhdr.className='bdiv';
		var tx="<a onClick='"+this.ref+".oparent.oparent.fnav();' class='menu_left' style=\"background:url('img/icon_ul.png') no-repeat center center\"> </a>";
		tx+="<a onClick=\""+this.ref+".fopen_contact();\" class='menu_right' style=\"background:url('img/icon_plus.png') no-repeat center center\"> </a>";

		this.hhdr.innerHTML=tx;
		this.target_hdr.appendChild(this.hhdr);
	}
}

ccontact.prototype.fshow=function(_aff){
	this.hctn.style.display='';
	this.hhdr.style.display='';
	this.nav.style.display='';
}

ccontact.prototype.fhide=function(){
	this.hctn.style.display='none';
	this.hhdr.style.display='none';
	this.nav.style.display='none';
}
