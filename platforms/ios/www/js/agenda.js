function cagenda(_ref,_pref,_oparent){
	this.ref=_ref;
	this.pref=_pref;
	this.oparent=_oparent;
	this.ncli=this.oparent.n;
	
	var auj=new Date();
	this.current_annee=auj.getFullYear();
	this.current_mois=auj.getMonth()+1;
	this.current_date=auj.getDate();
	
	this.aff=this.oparent.local_config.ag_aff;//facon d'affichage m:mois , w:semaine , d:jour
	
	this.ardvs_sync=new Array();//rdvs synced du serveur
	this.ardvs_sync_suppr=new Array();//rdvs supprimés synced du serveur
	this.acreneaux_sync_suppr=new Array();//creneaux supprimés synced du serveur
	
	this.ardvs=new Array();//rdvs
	this.acreneaux=new Array();//creneaux
	
	this.rdvcolor=this.oparent.rdvcolor;
	if(!this.rdvcolor)this.rdvcolor="#b5c6e8";
	this.tpcreneaux=this.oparent.tpcreneaux;
	this.tpmotifs=this.oparent.tpmotifs;
	
	this.ag_debut_agenda=+this.oparent.ag_debut_agenda;
	if(!this.ag_debut_agenda)this.ag_debut_agenda=5;
	this.ag_fin_agenda=+this.oparent.ag_fin_agenda;
	if(!this.ag_fin_agenda)this.ag_fin_agenda=22;
	this.ag_duree_rdv_std=+this.oparent.ag_duree_rdv_std;
	if(!this.ag_duree_rdv_std)this.ag_duree_rdv_std=5;
	
	this.ag_nbjours=+this.oparent.ag_nbjours;
	if(!this.ag_nbjours || this.ag_nbjours<3)this.ag_nbjours=6;
}

cagenda.prototype.finitial=function(){
	fshow_loading();	
	//date de la dernière sync sur laquelle la sync rdvs est basée
	this.last_sync=this.oparent.local_config.ag_last_sync;	
	//permettre MAJ de la date de dernière sync que pendant initialisation de synchro, redondance pour augmenter la fiabilité
	this.allow_update_last_sync=true;
	
	this.from=0;
	if(this.last_sync!=0){
		this.initial=0;
		//periode des rdvs à charger initialement
		this.rdv_ddeb=new Date(this.current_annee,this.current_mois-3,1);
		var j=new Date(this.current_annee,this.current_mois+2,0).getDate();
		this.rdv_dfin=new Date(this.current_annee,this.current_mois+1,j);
	}else{
		this.initial=1;
		this.rdv_ddeb=new Date(this.current_annee-100,1,1);
		this.rdv_dfin=new Date(this.current_annee+100,10,1);
		ftoast("La première synchronisation d'agenda peut prendre quelques minutes, veuillez patienter...",5000);
	}
	
	if(!this.tpcreneaux || !this.tpmotifs){//si offline -> motifs,creneaux ne sont pas chargés
		var qry="select * from ncb_tp_creneaux where ncli="+this.ncli+" order by ordre";
		odb.query(qry,this,this.fsuccess_get_local_creneaux_clb,null,"array");
	}else if(this.initial)this.fsync_agenda();
	else this.fget_local_rdvs(this.rdv_ddeb,this.rdv_dfin);
}

cagenda.prototype.fsuccess_get_local_creneaux_clb=function(myobj,p){
	myobj.tpcreneaux=new Array();
	for(var i in p){
		var atpcreneau=p[i];
		myobj.tpcreneaux[atpcreneau.n]=atpcreneau;
	}
	var qry="select * from ncb_tp_motifs where ncli="+myobj.ncli+" order by ordre";
	odb.query(qry,myobj,myobj.fsuccess_get_local_motifs_clb,null,"array");
}

cagenda.prototype.fsuccess_get_local_motifs_clb=function(myobj,p){
	myobj.tpmotifs=new Array();
	for(var i in p){
		var atpmotif=p[i];
		myobj.tpmotifs[atpmotif.n]=atpmotif;
	}
	if(myobj.initial)myobj.fsync_agenda();
	else myobj.fget_local_rdvs(myobj.rdv_ddeb,myobj.rdv_dfin);	
}

cagenda.prototype.fget_local_rdvs=function(ddeb,dfin){
	if(this.initial)return;
	if(!ddeb)return;
	ddeb=new Date(ddeb.getFullYear(),ddeb.getMonth(),1);
	if(!dfin){
		var j=new Date(ddeb.getFullYear(),ddeb.getMonth()+2,0).getDate();
		dfin=new Date(ddeb.getFullYear(),ddeb.getMonth()+1,j);
		if(ddeb>=this.rdv_ddeb && dfin<=this.rdv_dfin)return;
		
		if(ddeb>this.rdv_dfin)ddeb=this.rdv_dfin;
		if(dfin<this.rdv_ddeb)dfin<this.rdv_ddeb;
	}
	
	//ftoast(d2my(ddeb)+" "+d2my(dfin))
	var qry="select * from ncb_crm_actions where n_crm_clients="+this.ncli+" and n_tp_action in(5,20,21,22)";
	qry+=" and ddeb>='"+d2my(ddeb)+" 00:00:00' and dfin<='"+d2my(dfin)+" 23:59:59' order by ddeb desc";
	odb.query(qry,this,this.fsuccess_get_local_rdvs_clb,null,"array");
	if(ddeb<this.rdv_ddeb)this.rdv_ddeb=ddeb;
	if(dfin>this.rdv_dfin)this.rdv_dfin=dfin;
}

cagenda.prototype.fsuccess_get_local_rdvs_clb=function(myobj,p){
	for(var i in p){
		var ardv=p[i];
		myobj.fafficher_un_rdv(ardv);
		myobj.classify_rdv(ardv,true);
	}
	if(!myobj.fsync_timer)myobj.fsync_agenda();
}

cagenda.prototype.fsync_agenda=function(){
	console.log("!=============agenda sync");
	var req={
			soapmethod:'agenda',
			act:'mobile_sync',
			ncli:this.ncli,
			from:this.from,
			nsoc0:this.nsoc0,
			initial:this.initial,
			last_sync:this.last_sync
		}

	if(this.fsync_timer)clearTimeout(this.fsync_timer);
	soap.call(req,this.fsync_agenda_clb,this,this.fsync_agenda_offline);
}

cagenda.prototype.fsync_agenda_offline=function(myobj){
	myobj.fsync_timer=setTimeout(myobj.ref+".fsync_agenda()",15000);
}

cagenda.prototype.fsync_agenda_clb=function(r,rt,myobj,p){
	if(!r)return;
	var ndresync=r.selectSingleNode("./resync/@force");
	if(ndresync && ndresync.nodeValue==1){//forcer la resynchronisation à distance
		myobj.fresync();
		return;
	}
	var xrdv=r.selectNodes("./rows/row");
	for(var i in xrdv){
		var ardv=xmltag2array(xrdv[i]);
		if(ardv.n_tp_action==5){//pour couvrir le cas de consigne du jour;
			if(ardv.old)continue;
			ardv.n_action_orig=ardv.n;
		}
		myobj.fafficher_un_rdv(ardv);
		myobj.classify_rdv(ardv);
	}
	
	if(xrdv.length<3000){
		var qry=new Array();
		if(myobj.initial){
			setTimeout("ftoast('Fin de synchronisation.',5000)",1500);
			qry.push("delete from ncb_crm_actions where n_crm_clients="+myobj.ncli);
		}
		
		for(var i in myobj.ardvs_sync){
			var ardv=myobj.ardvs_sync[i];
			qry.push(insert_qry("ncb_crm_actions",ardv,true));
		}
		
		if(myobj.ardvs_sync_suppr.length>0)qry.push("delete from ncb_crm_actions where n_action_orig in ("+myobj.ardvs_sync_suppr.join(",")+") and sous_tp<3");
		if(myobj.acreneaux_sync_suppr.length>0)qry.push("delete from ncb_crm_actions where n_action_orig in ("+myobj.acreneaux_sync_suppr.join(",")+") and sous_tp>2");
		
		myobj.last_sync=r.selectSingleNode("./dteqry/@dteqry").nodeValue;
		if(myobj.allow_update_last_sync){			
			qry.push("update ncb_local_config set ag_last_sync='"+myobj.last_sync+"' where ncli="+myobj.ncli);
			myobj.allow_update_last_sync=false;
		}
		
		odb.query(qry,myobj);
		
		var interval=myobj.oparent.local_config.interval_ag;
		myobj.fsync_timer=setTimeout(myobj.ref+".fsync_agenda()",interval*60*1000);
		
		//vider les tableaux et reinisaliser les params pour la prochaine sync
		myobj.initial=0;
		myobj.from=0;
		myobj.ardvs_sync=new Array();
		myobj.ardvs_sync_suppr=new Array();	
		myobj.acreneaux_sync_suppr=new Array();
		setTimeout("fcancel_loading()",2000);
	}else{
		myobj.from=myobj.from + xrdv.length;
		myobj.fsync_timer=setTimeout(myobj.ref+".fsync_agenda()",3000);
	}	
}

cagenda.prototype.fafficher_un_rdv=function(ardv){
	if(this.omensuel)this.omensuel.fafficher_un_rdv(ardv);
	if(this.oweek)this.oweek.fafficher_un_rdv(ardv);
	if(this.oday)this.oday.fafficher_un_rdv(ardv);
}

cagenda.prototype.classify_rdv=function(ardv,deja_synced){
	var reg=new RegExp("[: -]","g");
	var adt=ardv["ddeb"].split(reg);
	
	if(ardv.sous_tp<3 || ardv.n_tp_action==5){//rdv ou consigne
		var m=adt[0]+'_'+(+adt[1]);
		if(ardv.n_tp_action==22){//remove the rdv in the table which stocks all the rdvs 
			if(!deja_synced)this.ardvs_sync_suppr.push(ardv.n_action_orig);		
			if(this.ardvs[m] && this.ardvs[m][ardv.n_action_orig]){delete this.ardvs[m][ardv.n_action_orig];}
		}else{//add the rdv in the table which stocks all the rdvs 
			if(!deja_synced)this.ardvs_sync.push(ardv);			
			if(!this.ardvs[m])this.ardvs[m]=new Array();
			this.ardvs[m][ardv.n_action_orig]=ardv;
		}
	}else{//creneau
		var aday=fget_week_days(adt[0],adt[1],adt[2]);
		var m=aday[0].getFullYear()+"_"+(aday[0].getMonth()+1)+"_"+aday[0].getDate();
		if(ardv.n_tp_action==22){//remove the rdv in the table which stocks all the creneaux 
			if(!deja_synced)this.acreneaux_sync_suppr.push(ardv.n_action_orig);		
			if(this.acreneaux[m] && this.acreneaux[m][ardv.n_action_orig]){delete this.acreneaux[m][ardv.n_action_orig];}
		}else{//add the creneau in the table which stocks all the creneaux 
			if(!deja_synced)this.ardvs_sync.push(ardv);
			if(!this.acreneaux[m])this.acreneaux[m]=new Array();
			this.acreneaux[m][ardv.n_action_orig]=ardv;
		}
	}	
}

cagenda.prototype.fresync=function(){
	fshow_loading();
	ftoast("Resynchronisation d'agenda en cours, cela peut prendre quelques minutes, veuillez patienter...",5000);
	this.ardvs=new Array();//rdvs
	this.acreneaux=new Array();//creneaux
	this.fauj();
	this.last_sync=0;
	this.allow_update_last_sync=true;
	this.from=0;
	this.initial=1;
	var dte=new Date();
	this.rdv_ddeb=new Date(dte.getFullYear()-100,1,1);
	this.rdv_dfin=new Date(dte.getFullYear()+100,10,1);
	this.fsync_agenda();
}

cagenda.prototype.fdisplay=function(_target_ctn){
	if(_target_ctn)this.target_ctn=_target_ctn;
	if(!this.target_ctn)return;

	if(!this.hctn){
		//cadre agenda
		this.hctn=document.createElement('div');
		this.hctn.id="ag_ctn_"+this.ncli;
		this.hctn.className='bdiv';
		this.target_ctn.appendChild(this.hctn);
		
		//cadre agenda month
		this.mhctn=document.createElement('div');
		this.mhctn.id="ag_mctn_"+this.ncli;
		this.mhctn.className='bdiv';
		this.hctn.appendChild(this.mhctn);
		
		//cadre agenda week
		this.whctn=document.createElement('div');
		this.whctn.id="ag_wctn_"+this.ncli;
		this.whctn.className='bdiv';
		this.hctn.appendChild(this.whctn);
		
		//cadre agenda day
		this.dhctn=document.createElement('div');
		this.dhctn.id="ag_dctn_"+this.ncli;
		this.dhctn.className='bdiv';
		this.hctn.appendChild(this.dhctn);
	}
}

cagenda.prototype.fdisplay_header=function(_target_hdr){
	if(_target_hdr)this.target_hdr=_target_hdr;
	if(!this.hhdr){
		//cadre agenda
		this.hhdr=document.createElement('div');
		this.hhdr.id="ag_hdr_"+this.ncli;
		this.hhdr.className='bdiv';
		var tx="<a onClick='"+this.ref+".oparent.oparent.fnav();' class='menu_left'> </a>";
		tx+="<a id='"+this.pref+"ag_select' class='m_select' onClick=\""+this.ref+".fag_menu(this);\"> </a>";
		tx+="<a onClick=\""+this.ref+".fauj();\" class='menu_right menu_right_calendar'>"+this.current_date+"</a>";
		tx+="<a onClick=\""+this.ref+".fopen_rdv();\" class='menu_right menu_right_plus'> </a>";
		this.hhdr.innerHTML=tx;
		this.target_hdr.appendChild(this.hhdr);
		this.hag_select=document.getElementById(this.pref+"ag_select");
	}
}

cagenda.prototype.fag_menu=function(obj){
	var awkd=new Array("Lun.","Mar.","Mer.","Jeu.","Ven.","Sam.","Dim.");
	var day=new Date(this.current_annee,this.current_mois-1,this.current_date).getDay();
	if(day==0)day=7;
	var tx="<div class='select_item' onclick=\""+this.ref+".fshow('d');fback_history();\">Jour<span class='exp'>"+awkd[day-1]+" "+this.current_date+" "+amois[this.current_mois-1]+" "+this.current_annee+"</span></div>";
	var adys=fget_week_days(this.current_annee,this.current_mois,this.current_date);
	tx+="<div class='select_item' onclick=\""+this.ref+".fshow('w');fback_history();\">Semaine<span class='exp'>"+jd2fr(adys[0])+"-"+jd2fr(adys[this.ag_nbjours-1])+"</span></div>";
	tx+="<div class='select_item' onclick=\""+this.ref+".fshow('m');fback_history();\">Mois<span class='exp'>"+amois[this.current_mois-1]+" "+this.current_annee+"</span></div>";	
	
	var now=new Date();
	var dtls=my2jd(this.last_sync);
	if(!dtls)tm="Pas encore synchronisé";
	else if(dtls.getFullYear()==now.getFullYear() && dtls.getMonth()==now.getMonth() && dtls.getDate()==now.getDate())var tm="Dernière sync à "+h2my(dtls);
	else var tm="Dernière sync le "+jd2fr(dtls);
	tx+="<div class='select_item' onclick=\"fshow_loading();"+this.ref+".fsync_agenda();fback_history();\">Actualiser<span class='exp'>"+tm+"</span></div>";	
	fcontext_menu(obj,tx,wwin*0.7);
}

cagenda.prototype.fauj=function(){
	var auj=new Date();
	this.current_annee=auj.getFullYear();
	this.current_mois=auj.getMonth()+1;
	this.current_date=auj.getDate();
	this.fshow();
}

cagenda.prototype.fshow=function(_aff){
	if(this.hctn)this.hctn.style.display='';
	if(this.hhdr)this.hhdr.style.display='';
	if(_aff && _aff==this.aff)return;
	if(_aff)this.aff=_aff;
	switch(this.aff){
		case "m":
			this.mhctn.style.display='';
			this.whctn.style.display='none';
			this.dhctn.style.display='none';
			if(this.hag_select)this.hag_select.innerHTML=amois[this.current_mois-1]+" "+this.current_annee;
			if(!this.omensuel)this.omensuel=new cmensuel(this.ref+".omensuel",this.pref+"mensuel",this,this.mhctn);
			else this.omensuel.finitial();
		break;
		case "w":
			this.mhctn.style.display='none';
			this.whctn.style.display='';
			this.dhctn.style.display='none';
			if(this.hag_select)this.hag_select.innerHTML=amois[this.current_mois-1]+" "+this.current_annee;
			if(!this.oweek)this.oweek=new cweek(this.ref+".oweek",this.pref+"week",this,this.whctn);
			else this.oweek.finitial();
		break;
		case "d":
			this.mhctn.style.display='none';
			this.whctn.style.display='none';
			this.dhctn.style.display='';
			var awkd=new Array("Lun.","Mar.","Mer.","Jeu.","Ven.","Sam.","Dim.");
			var day=new Date(this.current_annee,this.current_mois-1,this.current_date).getDay();
			if(day==0)day=7;
			if(this.hag_select)this.hag_select.innerHTML=awkd[day-1]+" "+this.current_date+" "+amois[this.current_mois-1]+" "+this.current_annee;
			if(!this.oday)this.oday=new cday(this.ref+".oday",this.pref+"day",this,this.dhctn);
			else this.oday.finitial();
		break;
	}	
}

cagenda.prototype.fhide=function(){
	this.hctn.style.display='none';
	this.hhdr.style.display='none';
}

cagenda.prototype.fopen_consigne=function(ddeb,n_action_orig){
	if(window.event)window.event.stopPropagation();
	var dt=my2jd(ddeb);
	var idt=dt.getFullYear()+'_'+(dt.getMonth()+1);
	if(this.ardvs[idt] && this.ardvs[idt][n_action_orig]){
		var ardv=this.ardvs[idt][n_action_orig];
		if(ardv["n_tp_action"]!=5)return;
	}else{
		var ardv=new Array();
		ardv.txt="";
	}
	
	var a=new Array();
	a["tp"]='dialog';
	a["w"]=wwin;
	a["h"]=hwin*0.6;
	a["pos"]="bottom";
	a["corner"]=false;
	var tx="<div class='bdiv'>";
	tx="<div class='popup_header'>";
	tx+="<div class='divTitleConsigne'>Consigne du "+jd2fr(my2jd(ddeb,3))+"</div>";
	tx+="<a class='menu_left_popup popup_consigne_save' onClick=\""+this.ref+".fsave_consigne('"+ddeb+"');\"> </a>";
	tx+="<a class='menu_right_popup popup_consigne_close' onClick=\"fback_history();\"> </a>";
	tx+="</div>"
	tx+="<div id='"+this.pref+"ctn_consigne' class='divConsigne' contenteditable='true' " +
		"style='height:"+(hwin*0.6-40)+"px;'><div>"+ardv.txt+"</div></div>";
	tx+="</div>";
	a["content"]=tx;
	fnew_page(a);
}

cagenda.prototype.fsave_consigne=function(ddeb){
	var hcons=document.getElementById(this.pref+"ctn_consigne");
	if(!hcons)return;
	var hnwk=soap.has_network();
	if(!hnwk){
		ftoast("Vous n'êtes pas connecté à Internet.");
		return;
	}
	var req={
			ag_dteqry: this.last_sync,
			soapmethod: 'agenda',
			dte:ddeb.substr(0,10),
			act:'consigne',
			n_client: this.ncli,
			n_utilisateur: user.n,
			nsociete:user.nsoc,
			txt:jQuery(hcons.innerHTML).text()
		};
	soap.call(req,this.fmaj_affichage,this);
	setTimeout("fback_history('')",400);
}

cagenda.prototype.fshow_detail_rdv=function(ddeb,n_action_orig){
	if(window.event)window.event.stopPropagation();
	var dt=my2jd(ddeb);
	var idt=dt.getFullYear()+'_'+(dt.getMonth()+1);
	if(!this.ardvs[idt] || !this.ardvs[idt][n_action_orig])return;
	var ardv=this.ardvs[idt][n_action_orig];
	
	if(ardv["sous_tp"]==1 && user.n!=this.ncli){
		ftoast("Rendez-vous privé d'une autre personne, vous ne pouvez pas le visualiser...",5000);
		return;
	}
	var a=new Array();
	a["tp"]='dialog';
	a["w"]=wwin;
	a["h"]=hwin*0.6;
	a["pos"]="bottom";
	a["corner"]=false;
	var tx="<div class='bdiv'>";
	tx="<div class='popup_header popup_rdv'>";
	tx+="<a class='menu_left_popup menu_left_trash_popup' onClick=\""+this.ref+".fsupp_rdv("+ardv.n+");\"> </a>";
	tx+="<a class='menu_left_popup menu_left_edit_popup' onClick=\"fback_history();"+this.ref+".fopen_rdv('"+ddeb+"',"+n_action_orig+");\"> </a>";
	tx+="<a class='menu_left_popup menu_left_fav_popup_rdv' onClick=\""+this.ref+".fmarquer_rdv('"+ddeb+"',"+n_action_orig+");\"> </a>";
	tx+="<a class='menu_right_popup menu_right_back_popup' onClick=\"fback_history();\"> </a>";
	tx+="</div>"
	
	tx+="<div class='popup_container popup_rdv_container'>";
	
	tx+="<div class='popup_main'>";
	
	tx+="<div class='rdv_object'>"+ardv["objet"]+"</div>";
	
	tx+=ardv["nv_client"]==1 ? "<div class='rdv_new_contact'>Nouveau contact</div>" : "";
	tx+=ardv["vis"]==1 ? "<div class='rdv_vad'>Visite à domicile</div>" : "";
	tx+=ardv["webag"]==1 ? "<div class='rdv_internet'>Rendez-vous pris par internet</div>" : "";
	
	if(ardv.emplacement)tx+="<div class='rdv_contact_tel'>"+tel_url(ardv.emplacement)+"</div>";
	
	tx+="</div>";
	
	tx+="<div class='rdv_sub'>";
	
	var dtd=my2jd(ardv.ddeb);
	var dtf=my2jd(ardv.dfin);
	var txp=h2my(dtd)+" - "+h2my(dtf)+" "+jd2fr2(dtd);
	if(dtd.getDate()!=dtf.getDate())txp=h2my(dtd)+" "+jd2fr2(dtd)+"-"+h2my(dtf)+" "+jd2fr2(dtf);
	tx+="<div class='rdv_date'>"+txp+"</div>";
	
	// TODO : ajouter adresse si visite à domicile -> ajouter la table des adresses
	// if (ardv["vis"]==1)
	
	var bgclr=this.rdvcolor;
	var motif="Rendez-vous";
	if(ardv["sous_tp"]==1){
		bgclr='orange';
		motif="Rendez-vous privé";
	}else if(this.tpmotifs && this.tpmotifs[ardv.nmotif]){
		bgclr=this.tpmotifs[ardv.nmotif]["couleur"];
		motif=this.tpmotifs[ardv.nmotif]["des"];
	}
	tx+="<div class='rdv_motif' style='background:"+bgclr+";'>"+motif+"</div>";
	if(ardv.txt)tx+="<div class='rdv_remarque' style='max-height:"+hwin/4+"px;'>"+ardv.txt+"</div>";
	
	var txc="";
	if(ardv.n_tp_action==20)txc+="Créé";
	else if(ardv.n_tp_action==21)txc+="Modifié";
	txc+=" le "+dt2fr(ardv.date_creation)+" par "+ardv.nom_usuel_ut;
	tx+="<div class='rdv_infos_creation'>"+txc+"</div>";
	tx+="</div>";
	tx+="</div>";
	tx+="</div>";
	
	a["content"]=tx;
	fnew_page(a);
}

cagenda.prototype.fopen_rdv=function(ddeb,n_action_orig,duree){
	if(window.event)window.event.stopPropagation();
    if(opopup) opopup.fdelete();
	this.act_rdv=null;
	var a=new Array();
	a["header"]="<a onClick=\"fback_history();\" class='menu_left menu_left_back'> </a>";
	if(ddeb){
		var dt=my2jd(ddeb);
		var dte_deb=d2my(dt);
		var hre_deb=h2my(dt);
		var hre_fin=h2my(new Date(dt.getTime()+(duree ? duree : this.ag_duree_rdv_std)*60*1000));
	}else{
		var dt=new Date();
		var dte_deb=d2my();
		var hre_deb="10:00";
		var hre_fin="10:"+(this.ag_duree_rdv_std>9 ? "" :"0")+this.ag_duree_rdv_std;
	}
	if(!n_action_orig)n_action_orig=0;
	var idt=dt.getFullYear()+'_'+(dt.getMonth()+1);
	
	var objet="";
	var empl="";
	
	var txt="";
	var nmtf=0;
	var vis=false;
	var nv_client=false;
	var rappel=false;
	var lco=0;
	var func_save=this.ref+".fsave_rdv()";
	
	if(this.ardvs[idt] && this.ardvs[idt][n_action_orig]){//modifier rdv
		var ardv=this.ardvs[idt][n_action_orig];
		this.act_rdv=ardv;
		
		objet=ardv.objet;
		empl=ftel_lisible(ardv.emplacement);
		var dd=ardv.ddeb.split(' ');
		var df=ardv.dfin.split(' ');
		dte_deb=dd[0];
		hre_deb=dd[1].substr(0,5);
		hre_fin=df[1].substr(0,5);
		txt=ardv.txt;
		if(ardv.sous_tp==1){//rdv privé
			if(this.ncli!=user.n)return false;
			else nmtf=1;
		}else nmtf=ardv.nmotif;
		vis=ardv.vis;
		nv_client=ardv.nv_client;
		rappel=ardv.rappel;
		lco=ardv.lco;		
		func_save="fconfirm('Voulez-vous vraiment modifier ce rendez-vous ?','"+this.ref+".fsave_rdv()')";
		a["header"]+="<div class='divTitle'>Modifier rendez-vous</div>";
	}else a["header"]+="<div class='divTitle'>Nouveau rendez-vous</div>";
	
	a["header"]+="<a onClick=\""+func_save+"\"; class='menu_right menu_right_check'> </a>";
	a["content"]="<table style='position:absolute;' class='struct'>";
	var pajax=new Array();
	pajax.placeholder="Nom du contact";
	pajax.min_len=2;
	pajax.v=objet;
	pajax.req={
    	soapmethod : 'sql',
        idqry : 'contact',
        ncli : this.ncli
    }
	pajax.ofl_req="select nom_usuel as v1,n as v2, " +
				"CASE WHEN tel_mobile!='' THEN tel_mobile ELSE (CASE WHEN tel_pri!='' THEN tel_pri ELSE tel_pro END) END as v3 from ncb_sys_contacts " +
				"where n_sys_contact_pere="+this.ncli+" and (nom like ? or prenom like ? or nom_usuel like ?) limit 0,15";
	pajax.flist_item=function(aval){
		var tx="<div class='divContactResult'><div style='height:25px;line-height:25px;font-size:16px;position:relative;top:0;left:0;'>"+aval.v1+"</div>";
		tx+="<div style='height:15px;line-height:15px;font-size:13px;position:relative;top:0;left:0;'>"+tel_url(aval.v3)+"</div></div>";
		return tx;
	}
	
	pajax.outputs={
		v1:	this.pref+"ocon_selecta",
		v2: this.pref+"lco",
		v3: this.pref+"emplacement"
	}
	
	this.ocon_selecta=new cselectajax(this.ref+".ocon_selecta",this.pref+"ocon_selecta",pajax);
	
	a["content"]+="<tr><td colspan='2'>"+this.ocon_selecta.fcreate()+hidden(this.pref+"lco","lco",lco)+"</td></tr>";
	a["content"]+="<tr><td colspan='2'>"+text(this.pref+"emplacement","","placeholder='Téléphone'",empl,"text")+"</td></tr>";
	
	this.odpicker=new ctime_picker(this.ref+'.odpicker',this.pref+'dpicker','day',dte_deb);
	a["content"]+="<tr><td rowspan='2'>"+this.odpicker.fcreate()+"</td>";
	this.otdpicker=new ctime_picker(this.ref+'.otdpicker',this.pref+'tdpicker','time',hre_deb,5,this.ref+".fonchange_ddeb('motif')");
	a["content"]+="<td>"+this.otdpicker.fcreate()+"</td></tr>";
	this.otfpicker=new ctime_picker(this.ref+'.otfpicker',this.pref+'tfpicker','time',hre_fin,5);
	a["content"]+="<tr><td>"+this.otfpicker.fcreate()+"</td></tr>";
	
	var ar=new Array();
	ar[0]="<span style='background:"+this.rdvcolor+";'>&nbsp;&nbsp;&nbsp;</span> Rendez-vous";
	if(user.n==this.ncli)ar[1]="<span style='background:orange;'>&nbsp;&nbsp;&nbsp;</span> Rendez-vous privé";
	for(var i in this.tpmotifs){
		ar[i]="<span style='background:"+this.tpmotifs[i]["couleur"]+";'>&nbsp;&nbsp;&nbsp;</span> "+this.tpmotifs[i]["des"];
		if(+this.tpmotifs[i]["duree"])ar[i]+='('+this.tpmotifs[i]["duree"]+' min.)';
	}
	this.slmotif=new cselect(this.ref+".slmotif","slmotif",ar,nmtf,this.ref+".fonchange_motif");
	a["content"]+="<tr><td colspan='2'>"+this.slmotif.fcreate("","selectRdv")+"</td></tr>";
	a["content"]+="<tr><td colspan='2'>"+textarea(this.pref+"txt","","placeholder='Remarque'",txt)+"</td></tr>";
	a["content"]+="<tr><td colspan='2'>"+checkbox(this.pref+"vad","vis",vis,"Visite à domicile")+"</td></tr>";
	a["content"]+="<tr><td colspan='2'>"+checkbox(this.pref+"nv_client","nv_client",nv_client,"Nouveau contact")+"</td></tr>";
	a["content"]+="<tr><td colspan='2'>"+checkbox(this.pref+"rappel","rappel",rappel,"Rappel contact mail & SMS")+"</td></tr>";
	a["content"]+="</table>";
	
	fnew_page(a,'right');
}

cagenda.prototype.fmarquer_rdv=function(ddeb,n_action_orig){
	var dt=my2jd(ddeb);
	var idt=dt.getFullYear()+'_'+(dt.getMonth()+1);	
	if(!this.ardvs[idt] || !this.ardvs[idt][n_action_orig])return;
	this.act_rdv=this.ardvs[idt][n_action_orig];	
	var a=new Array();
	a["tp"]='dialog';
	a["w"]=260;
	a["h"]=200;
	a["content"]="<div style='width:100%;text-align:center;'>";
	a["content"]="<div class='select_item' style='background:#fff;color:green;font-weight:bold;border-radius:3px 3px 0 0;'>Marquer comme...</div>";
	
	var stl="";
	if(this.act_rdv["depl"]==1)stl="style='color:#FF9966;'";
	a["content"]+="<div class='select_item' "+stl+" onClick=\"fback_history();"+this.ref+".fmarquer_rdv2(4)\">A déplacer</div>";
	stl="";
	if(this.act_rdv["pasvenu"]==1)stl="style='color:#FF9966;'";
	a["content"]+="<div class='select_item' "+stl+" onClick=\"fback_history();"+this.ref+".fmarquer_rdv2(1)\">Absent</div>";
	stl="";
	if(this.act_rdv["pasvenu"]==2)stl="style='color:#FF9966;'";
	a["content"]+="<div class='select_item' "+stl+" onClick=\"fback_history();"+this.ref+".fmarquer_rdv2(2)\">Présent</div>";
	stl="";
	if(this.act_rdv["pasvenu"]==3)stl="style='color:#FF9966;'";
	a["content"]+="<div class='select_item' "+stl+" onClick=\"fback_history();"+this.ref+".fmarquer_rdv2(3)\">En salle d'attente</div>";
	a["content"]+="<div class='select_item' style='border-radius:0 0 3px 3px;' onClick=\"fback_history()\">Annuler</div>";
	a["content"]+="</div>";
	fnew_page(a);
}

cagenda.prototype.fmarquer_rdv2=function(n){
	if(!this.act_rdv)return;
	var req={
				soapmethod:'workflow',
				n_action:this.act_rdv['n']
			}
	if(n==4){
		req.act='depl';
		req.val=1-(+this.act_rdv["depl"]);
	}else{
		req.act='pasvenu';
		if(n==this.act_rdv["pasvenu"])req.val=0;
		else req.val=n;
	}
	
	soap.call(req,this.fmaj_affichage,this);	
	this.act_rdv=null;
}

cagenda.prototype.fonchange_motif=function(i){
	if(+this.tpmotifs[i]["duree"]==0)return;
	var jddeb=my2jd(this.odpicker.dte+" "+this.otdpicker.dte);
	var jdfin=new Date(jddeb.getTime()+(+this.tpmotifs[i]["duree"])*60*1000);
	this.otfpicker.fset_value_by_date(h2my(jdfin));
}

cagenda.prototype.fonchange_creneau=function(i){
	var htxt=document.getElementById(this.pref+"txt");
	if(htxt && this.tpcreneaux[i]["txt"])htxt.value=this.tpcreneaux[i]["txt"];
	if(+this.tpcreneaux[i]["duree"]==0)return;
	var jddeb=my2jd(this.odpicker.dte+" "+this.otdpicker.dte);
	var jdfin=new Date(jddeb.getTime()+(+this.tpcreneaux[i]["duree"])*60*1000);
	this.otfpicker.fset_value_by_date(h2my(jdfin));
}

cagenda.prototype.fonchange_ddeb=function(tp){
	var jddeb=my2jd(this.odpicker.dte+" "+this.otdpicker.dte);
	var duree=this.ag_duree_rdv_std;	
	switch(tp){
		case "motif":
			if(this.slmotif.v>1 && +this.tpmotifs[this.slmotif.v]["duree"]){
				duree=+this.tpmotifs[this.slmotif.v]["duree"];
			}
		break;		
		case "creneau":
			if(this.slcreneau && +this.tpcreneaux[this.slcreneau.v]["duree"]){
				duree=+this.tpcreneaux[this.slcreneau.v]["duree"];
			}
		break;
	}
	
	var jdfin=new Date(jddeb.getTime()+duree*60*1000);
	this.otfpicker.fset_value_by_date(h2my(jdfin));
}

cagenda.prototype.fsave_rdv=function(){
	var hnwk=soap.has_network();
	if(!hnwk){
		ftoast("Vous n'êtes pas connecté à Internet.");
		return;
	}
	var req={
			ag_dteqry: this.last_sync,
			soapmethod: 'agenda',
			act:'enrc_rdv',
			n_client: this.ncli,
			n_utilisateur: user.n,
			sous_tp:0,
			translate:0
		};
	if(this.act_rdv){
		req.n_rdv=this.act_rdv.n;
		req.n_tp_action=21;
		req.n_action_orig=this.act_rdv.n_action_orig;
		req.lu=this.act_rdv.lu;
	}else{
		req.n_rdv=0;
		req.n_tp_action=20;
		req.n_action_orig=0;
		if(this.ncli==user.n)req.lu=1;
		else req.lu=0;
	}
	
	req.lco=document.getElementById(this.pref+"lco").value;
	req.objet=document.getElementById(this.pref+"ocon_selecta").value;
	req.emplacement=document.getElementById(this.pref+"emplacement").value;
	req.date_debut=this.odpicker.dte;
	req.date_fin=this.odpicker.dte;
	req.hre_debut=this.otdpicker.dte;
	req.hre_fin=this.otfpicker.dte;
	req.nmotif=this.slmotif.v;
	if(req.nmotif==1){//rdv privé
		req.nmotif=0;
		req.sous_tp=1;
	}
	req.txt=br2nl(document.getElementById(this.pref+"txt").innerHTML);
	if(document.getElementById(this.pref+"vad").checked)req.vis=1;
	else req.vis=0;

	if(document.getElementById(this.pref+"nv_client").checked) {
		req.nv_client=1;
		req.nvcontact=1;
	} else {
		req.nv_client=0;
		req.nvcontact=0;
	}
	
	if(document.getElementById(this.pref+"rappel").checked)req.rappel=1;
	else req.rappel=0;
	soap.call(req,this.fmaj_affichage,this);
	setTimeout("fback_history('')",400);
}

cagenda.prototype.fsupp_rdv=function(n){
	fconfirm("Supprimer ce rendez-vous ?"+text(this.pref+"raison_sup","","placeholder='Saisir la raison'",""),this.ref+".fsupp_rdv2("+n+")","",120);
}

cagenda.prototype.fsupp_rdv2=function(n){
	var req={
			ag_dteqry: this.last_sync,
			soapmethod: 'agenda',
			act:'suppr_rdv',
			n_rdv:n,
			n_client:this.ncli,
			n_utilisateur:user.n,
			nonfact:0,
			translate:0,
			txt:document.getElementById(this.pref+"raison_sup").value
		}
	soap.call(req,this.fmaj_affichage,this);
}

cagenda.prototype.fopen_canvas=function(ddeb,type){
	if(!ddeb)return;
	var a=new Array();
	a["header"]="<a onClick=\"fback_history();\" class='menu_left menu_left_back'> </a>";
	var dt=my2jd(ddeb);
	var dte_deb=d2my(dt);
	var hre_deb=h2my(dt);
	var hre_fin=h2my(new Date(dt.getTime()+this.ag_duree_rdv_std*60*1000));
	
	if(type=='new')a["header"]+="<div class='divTitle'>Nouveau cavenas</div>";
	else a["header"]+="<div class='divTitle'>Supprimer canevas</div>";
	a["header"]+="<a onClick=\""+this.ref+".fsave_canvas('"+type+"')\"; class='menu_right menu_right_check'> </a>";
	a["content"]="<table style='position:absolute;' class='struct'>";
	if(type=='new')a["content"]+="<tr><td colspan='2'>"+text(this.pref+"txt","","placeholder='Libellé canevas'")+"</td></tr>";
	
	this.odpicker=new ctime_picker(this.ref+'.odpicker',this.pref+'dpicker','day',dte_deb);
	a["content"]+="<tr><td rowspan='2'>"+this.odpicker.fcreate()+"</td>";
	this.otdpicker=new ctime_picker(this.ref+'.otdpicker',this.pref+'tdpicker','time',hre_deb,5,this.ref+".fonchange_ddeb('creneau')");
	a["content"]+="<td>"+this.otdpicker.fcreate()+"</td></tr>";
	this.otfpicker=new ctime_picker(this.ref+'.otfpicker',this.pref+'tfpicker','time',hre_fin,5);
	a["content"]+="<tr><td>"+this.otfpicker.fcreate()+"</td></tr>";
	
	if(type=='new'){
		var ar=new Array();
		for(var i in this.tpcreneaux){
			ar[i]="<span style='background:"+this.tpcreneaux[i]["couleur"]+";'>&nbsp;&nbsp;&nbsp;</span> "+this.tpcreneaux[i]["des"];
			if(+this.tpcreneaux[i]["duree"])ar[i]+='('+this.tpcreneaux[i]["duree"]+' min.)';
		}
		this.slcreneau=new cselect(this.ref+".slcreneau","slcreneau",ar,'',this.ref+".fonchange_creneau");
		a["content"]+="<tr><td colspan='2'>"+this.slcreneau.fcreate("","selectCanevas")+"</td></tr>";	
	}
	
	a["content"]+="</table>";
	
	fnew_page(a,'right');
}

cagenda.prototype.fsave_canvas=function(type){
	var hnwk=soap.has_network();
	if(!hnwk){
		ftoast("Vous n'êtes pas connecté à Internet.");
		return;
	}
	var req={
			soapmethod:'agenda',
			act:'enrc_canevas',
			ag_dteqry:this.last_sync,
			nbjouraff:this.ag_nbjours,
			n_utilisateur:user.n,
			n_client:this.ncli,
			date_debut:this.odpicker.dte,
			date_fin:this.odpicker.dte,
			hre_debut:this.otdpicker.dte,
			hre_fin:this.otfpicker.dte,
			jentier:0,
			sous_tp:3
		};
	if(type=="new"){
		req.nmotif=this.slcreneau.v;
		req.txt=document.getElementById(this.pref+"txt").value;
	}else if(type=="delete"){
		req.nmotif=-2;
	}
	
	soap.call(req,this.fmaj_affichage,this);
	setTimeout("fback_history('')",400);
}

cagenda.prototype.fmaj_affichage=function(r,rt,myobj,req){
	if(!r){
		ftoast("Erreur connexion.");
		return;
	}
	switch(req.act){
		case "enrc_rdv":
			var nx=r.selectSingleNode("./rdv");
			if(nx)ftoast("Rendez-vous enregistré.");
			else{
				ftoast("Le rendez-vous n'a pas pu être enregistré, veuillez réessayer plus tard.");
				return;
			}
		break;
		case "suppr_rdv":
			var nx=r.selectSingleNode("./rdvsuppr/text()");
			if(nx.nodeValue)ftoast("Rendez-vous supprimé.");
			else{
				ftoast("Le rendez-vous n'a pas pu être supprimé, veuillez réessayer plus tard.");
				return;
			}
		break;
	}
	fshow_loading();
	myobj.fsync_agenda();
}

cagenda.prototype.faction_start=function(e){
	if(this.show_action_timer)clearTimeout(this.show_action_timer);
	var dte=e.touches[0].target.getAttribute('dte');
	if(!dte)return;
	this.show_action_timer=setTimeout(this.ref+".fshow_action('"+dte+"')",1200);
}

cagenda.prototype.faction_end=function(){
	if(this.show_action_timer)clearTimeout(this.show_action_timer);
}

cagenda.prototype.fshow_action=function(dte){
	var jdte=my2jd(dte);
	var a=new Array();
	a["tp"]='dialog';
	a["w"]=260;
	a["h"]=200;
	a["content"]="<div style='width:100%;text-align:center;'>";
	a["content"]="<div class='select_item' style='background:#fff;color:green;font-weight:bold;border-radius:3px 3px 0 0;'>"+jd2fr2(jdte)+" "+jh2fr(jdte)+"</div>";
	a["content"]+="<div class='select_item' onClick=\""+this.ref+".fopen_consigne('"+dte+"')\">Consigne du jour</div>";
	a["content"]+="<div class='select_item' onClick=\"fback_history();"+this.ref+".fopen_rdv('"+dte+"')\">Nouveau rendez-vous</div>";
	a["content"]+="<div class='select_item' onClick=\"fback_history();"+this.ref+".fopen_canvas('"+dte+"','new')\">Nouveau canevas</div>";
	a["content"]+="<div class='select_item' onClick=\"fback_history();"+this.ref+".fopen_canvas('"+dte+"','delete')\">Supprimer canevas</div>";
	a["content"]+="<div class='select_item' style='border-radius:0 0 3px 3px;' onClick=\"fback_history()\">Annuler</div>";
	a["content"]+="</div>";
	fnew_page(a);
}

//agenda jour===========================================
function cday(_ref,_pref,_oparent,_target){
	this.ref=_ref;
	this.pref=_pref;
	this.oparent=_oparent;

	this.target=_target;
	this.finitial();	
	this.tra=false;
}

cday.prototype.finitial=function(_target){
	if(_target)this.target=_target;
	if(!this.target)return;
	this.ag_debut_agenda=this.oparent.ag_debut_agenda;
	this.ag_fin_agenda=this.oparent.ag_fin_agenda;
	this.ag_duree_rdv_std=this.oparent.ag_duree_rdv_std;
	var tx="<div class='day' ontouchstart='"+this.ref+".ftouchstart(event)' ontouchmove='"+this.ref+".ftouchmove(event)' ontouchend='"+this.ref+".ftouchend(event)'></div>";
	this.target.innerHTML=tx;
	this.hday=this.target.childNodes[0];
	this.offsetLeft=-wwin+1;
	this.hday.style.WebkitTransform="translate3d("+this.offsetLeft+"px, 0 , 0)";
	
	this.lheight=37;
	var nbrow=(this.ag_fin_agenda-this.ag_debut_agenda)*60/this.oparent.ag_duree_rdv_std;
	if((this.hday.offsetHeight-20)/nbrow>this.lheight)this.lheight=(this.hday.offsetHeight-5)/nbrow;
	
	//creer cadre d'agenda de jour précédent
	var dte=new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date-1);		
	this.tbd_pre=this.fcreate_cadre(dte.getFullYear(),dte.getMonth()+1,dte.getDate());
	this.hday.appendChild(this.tbd_pre);
	this.fafficher_rdvs(dte.getFullYear(),dte.getMonth()+1,dte.getDate());
	
	//creer cadre d'agenda de jour courant
	this.tbd=this.fcreate_cadre(this.oparent.current_annee,this.oparent.current_mois,this.oparent.current_date);
	this.hday.appendChild(this.tbd);
	this.fafficher_rdvs(this.oparent.current_annee,this.oparent.current_mois,this.oparent.current_date);
	
	//creer cadre d'agenda de jour suivant
	dte=new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date+1);	
	this.tbd_sui=this.fcreate_cadre(dte.getFullYear(),dte.getMonth()+1,dte.getDate());
	this.hday.appendChild(this.tbd_sui);
	this.fafficher_rdvs(dte.getFullYear(),dte.getMonth()+1,dte.getDate());
	this.allow_scr=true;
}

cday.prototype.fcreate_cadre=function(y,m,d){
	var tbd=document.createElement("div");
	tbd.className='ctn';
	var tx="<div><table>";
	
	tx+="<tr><td colspan=2 id='consigne_"+y+"_"+m+"_"+d+"' style='border:0;background:#eae672;text-align:center;display:none;height:35px;'></td></tr>";
	for(var h=0;h<24*60/this.ag_duree_rdv_std;h++){
		if(h<this.ag_debut_agenda*60/this.ag_duree_rdv_std || h>this.ag_fin_agenda*60/this.ag_duree_rdv_std-1)continue;
		var hre=Math.floor(h*this.ag_duree_rdv_std/60);
		if(hre<10) hre='0'+hre;
		var min=Math.round((h*this.ag_duree_rdv_std/60-hre)*60);
		if(min<10) min='0'+min;
		var str_hr=hre+':'+min;
		tx+="<tr><td class='tdHoursMinutes' style='height:"+(this.lheight-2)+"px;'><div>"+str_hr+"</div></td>";
		var dtid=this.fdt2id(y,m,d,+hre,+min);
		var jdte=new Date(y,m-1,d,+hre,+min);
		var dte=jd2my(jdte);
		var hpast="";
		var now=new Date();
		if(h==this.ag_debut_agenda*60/this.ag_duree_rdv_std && jdte.getTime()<now.getTime()){
			if(now.getFullYear()==jdte.getFullYear() && now.getMonth()==jdte.getMonth() 
			  && now.getDate()==jdte.getDate() && now.getHours()<this.ag_fin_agenda)var nbrl=Math.floor(((now.getHours()-this.ag_debut_agenda)*60+now.getMinutes())/this.ag_duree_rdv_std);
			else var nbrl=(this.ag_fin_agenda-this.ag_debut_agenda)*60/this.ag_duree_rdv_std;
			var ht=(this.lheight+1)*nbrl;
			if(ht>0)hpast="<div class='past' style='height:"+ht+"px;'></div>"
		}
		tx+="<td class='tdRdv' id='"+dtid+"' " +
			"ontouchstart=\""+this.ref+".oparent.faction_start(event)\" " +
			"ontouchend=\""+this.ref+".oparent.faction_end()\" " +
			"onClick=\""+this.ref+".oparent.fopen_rdv('"+dte+"')\" dte='"+dte+"' nbrdv=0 style='height:"+(this.lheight-2)+"px;'>"+hpast+"</td></tr>";
	}
	tx+="</table></div>";
	tbd.innerHTML=tx;
	return tbd;
}

cday.prototype.fafficher_rdvs=function(y,m,d,tbd){
	var aday=fget_week_days(y,m,d);
	var acreneaux=this.oparent.acreneaux[aday[0].getFullYear()+"_"+(aday[0].getMonth()+1)+"_"+aday[0].getDate()];
	if(acreneaux){
		for(var i in acreneaux){
            var creneau = acreneaux[i];
            if(my2jd(creneau.ddeb).getDate() <= d && my2jd(creneau.dfin).getDate() >= d){
                this.fafficher_un_rdv(creneau,tbd);
            }
		}
	}
	
	var ardvs=this.oparent.ardvs[y+'_'+m];
	if(ardvs){
		for(var i in ardvs){
			if(my2jd(ardvs[i].ddeb).getDate()!=d)continue;
			this.fafficher_un_rdv(ardvs[i],tbd);
		}
	}	
	
}

cday.prototype.fafficher_un_rdv=function(ardv,tbd){
	//si consigne du jour
	if(ardv["n_tp_action"]==5){
		var reg=new RegExp("[: -]",'g');
		var adtc=ardv["ddeb"].split(reg);
		var cid="consigne_"+(+adtc[0])+"_"+(+adtc[1])+"_"+(+adtc[2]);
		if(!tbd)var hcons=document.getElementById(cid);
		else var hcons=tbd.querySelector('#'+cid);
		if(hcons){
			if(ardv["old"] || !ardv["txt"]){
				hcons.innerHTML=="";
				hcons.style.display='none';
				hcons.removeAttribute('onClick');
			}else{
				var txcon=ardv["txt"];
				if(txcon.length>120)txcon=txcon.substr(0,120)+"...";
				hcons.innerHTML=txcon;
				hcons.style.display='';
				hcons.setAttribute('onClick',this.oparent.ref+".fopen_consigne('"+ardv.ddeb+"',"+ardv.n_action_orig+")");
			}
			
		}
		return;
	}
	
	//si rdv
	var delm=null;
	if(ardv["sous_tp"]<3)delm=document.getElementById("drdv_"+ardv["n_action_orig"]);
	else delm=document.getElementById("dcreneau_"+ardv["n_action_orig"]);
	if(delm){
		//if(ardv["n_tp_action"]==20)return;
		if(ardv["sous_tp"]<3){
			var nbrdv=+delm.parentNode.getAttribute("nbrdv");
			delm.parentNode.setAttribute("nbrdv",nbrdv-1);
		}
		//delm.parentNode.removeChild(delm);
	}
	if(ardv["n_tp_action"]==22)return;		
	if(Math.abs(my2jd(ardv["ddeb"]).getTime()-new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date).getTime())>1000*60*60*24*4)return;
    
    
    var diffDays = dateDiff(my2jd(ardv["ddeb"]).setHours(0,0,0,0),my2jd(ardv["dfin"]).setHours(0,0,0,0));
    
    var arrayW = new Array();
    var arrayDdeb = new Array();
    var arrayDfin = new Array();
    var arrayAttributeTop = new Array();
    
    // On cherche les cases correspondants au créneau courant
    for (var i = 0; i <= diffDays.day; i++) {
        var wTemp = null;
        
        var reg = new RegExp("[: -]","g");
        
        if (i > 0) {
            var date = addDays(my2jd(ardv["ddeb"]).setHours(this.ag_debut_agenda), i); // rajoute i nombre de jours
        } else {
            var date = my2jd(ardv["ddeb"]);
        }
        
        var adt = formatDate(date).split(reg);
        
        if(+adt[3]<this.ag_debut_agenda){
            adt[3]=this.ag_debut_agenda<10 ? "0"+this.ag_debut_agenda : this.ag_debut_agenda;
            adt[4]="00";
        }
        
        var wid=this.pref+adt[0]+"_"+adt[1]+"_"+adt[2]+"_"+adt[3]+"_"+adt[4];
        if(!tbd)var wTemp=document.getElementById(wid);
        else var wTemp=tbd.querySelector('#'+wid);
        var top=0;
        
        if(!wTemp){
            for(var k=0;k<=this.ag_duree_rdv_std;k++){
                top=Math.floor((k+1)*this.lheight/this.ag_duree_rdv_std);
                wid=this.fdt2id(adt[0],+adt[1],+adt[2],+adt[3],+adt[4]-k-1)
                if(!tbd)wTemp=document.getElementById(wid);
                else wTemp=tbd.querySelector('#'+wid);
                if(wTemp)break;
            }
        }
        
        if (wTemp) {
            arrayW.push(wTemp);
            arrayDdeb.push(date);
            
            var dateFin = new Date(date);
            dateFin.setHours(this.ag_fin_agenda, 0, 0, 0);
            
            arrayDfin.push(dateFin);
            
            arrayAttributeTop.push(top);
        }
        
        
    }
	
	if(+ardv["sous_tp"]<3){
                
        var reg=new RegExp("[: -]","g");
        var adt=ardv["ddeb"].split(reg);
        if(+adt[3]<this.ag_debut_agenda){
            adt[3]=this.ag_debut_agenda<10 ? "0"+this.ag_debut_agenda : this.ag_debut_agenda;
            adt[4]="00";
        }
        var did=this.pref+adt[0]+"_"+adt[1]+"_"+adt[2]+"_"+adt[3]+"_"+adt[4];
        if(!tbd)var d=document.getElementById(did);
        else var d=tbd.querySelector('#'+did);
        var top=0;
        
        if(!d){
            for(var k=0;k<=this.ag_duree_rdv_std;k++){
                top=Math.floor((k+1)*this.lheight/this.ag_duree_rdv_std);
                did=this.fdt2id(adt[0],+adt[1],+adt[2],+adt[3],+adt[4]-k-1);
                if(!tbd)d=document.getElementById(did);
                else d=tbd.querySelector('#'+did);
                if(d)break;
            }
        }
        if(!d)return;

        
		var nbrl=(my2jd(ardv["dfin"]).getTime()-my2jd(ardv["ddeb"]).getTime())/(1000*60*this.ag_duree_rdv_std);
		var drdv=document.createElement('div');
		drdv.className='rdv_day';
		drdv.setAttribute('dte',ardv["ddeb"]);
		drdv.setAttribute('onClick',this.oparent.ref+".fshow_detail_rdv('"+ardv.ddeb+"',"+ardv.n_action_orig+")");
		var txrdv="";
		switch(+ardv["pasvenu"]){
			case 1:
				drdv.style.textDecoration='line-through';
			break;
			case 2:
				txrdv+="<span style='color:#C80000;'>(P)</span>";
			break;
			case 3:
				txrdv+="<span style='color:#505050;'>(A)</span>";
			break;
		}
		if(ardv["depl"]==1)drdv.style.color='#FF3399';
		drdv.innerHTML=txrdv+(ardv["nv_client"]==1 ? "<span style='color:#A00000;'>(N)</span> " : "")+
					   (ardv["vis"]==1 ? "<span style='color:#FF6633;'>(V)</span> " : "")+
					   (ardv["webag"]==1 ? "<span style='color:#336600;'>(W)</span> " : "")+
					   ((ardv["sous_tp"]==1 && user.n!=this.oparent.ncli) ? "Privé" : ardv["objet"]);
		drdv.id="drdv_"+ardv["n_action_orig"];
		drdv.style.height=(nbrl*this.lheight+nbrl-1)+"px";
		drdv.style.top=top+"px";
		
		var nbrdv=+d.getAttribute("nbrdv");
		drdv.style.marginLeft=(this.lheight-5+nbrdv*wwin/(nbrdv+2))+"px";
		//drdv.style.width=(wwin-24-this.lheight-nbrdv*wwin/(nbrdv+2))+"px";
		drdv.style.width = "89%";
		if(ardv["catcouleur"])drdv.style.backgroundColor=ardv["catcouleur"];
		else if(ardv["sous_tp"]==1)drdv.style.backgroundColor='orange';
		else if(this.oparent.tpmotifs && this.oparent.tpmotifs[ardv.nmotif])drdv.style.backgroundColor=this.oparent.tpmotifs[ardv.nmotif]["couleur"];
		else if(this.oparent.rdvcolor)drdv.style.backgroundColor=this.oparent.rdvcolor;
		
		d.appendChild(drdv);
		d.setAttribute("nbrdv",nbrdv+1);
        
	} else {
        for (var i = 0; i < arrayW.length; i++) {
            
            var ddeb = new Date(arrayDdeb[i]);
            var dfin = new Date(my2jd(ardv["dfin"]));
            
            var dtd_min = new Date(ddeb);
            dtd_min.setHours(this.ag_debut_agenda);
            dtd_min.setMinutes(0);
            if(my2jd(ardv["ddeb"]).getTime()<dtd_min.getTime())ddeb=dtd_min;
            
            var dtf_max= new Date(arrayDfin[i]);
            dtf_max.setHours(this.ag_fin_agenda);
            dtf_max.setMinutes(0);
            if(my2jd(ardv["dfin"]).getTime()>dtf_max.getTime())dfin=dtf_max;
            
            var nbrl=Math.ceil((dfin.getTime()-ddeb.getTime())/(1000*60*this.ag_duree_rdv_std));
			
			if(!this.oparent.tpcreneaux)return;
			
			var bgclr=ardv.catcouleur;
			
			var dureeCreneau = 0;

			if (this.oparent.tpcreneaux[ardv.nmotif]) {
				// On récupère la durée du créneau via le motif
				dureeCreneau = this.oparent.tpcreneaux[ardv.nmotif]["duree"];
			} else if (ardv.temps_traitement && ardv.temps_traitement != 0) {
				// On se base sur le temps_traitement (nouvelle colonne ajoutée dans l'app version 2.1.6)
				dureeCreneau = ardv.temps_traitement;
			} else {
				// On calcule la durée du créneau
				dureeCreneau = ((my2jd(ardv["dfin"]).getTime()-my2jd(ardv["ddeb"]).getTime()) / 60000); // Durée du créneau en minutes
			}
			
			var duree=+dureeCreneau;
			
			if(duree==0)duree=this.ag_duree_rdv_std;

			var dispo=ardv.dispo;
			
            var dcre=document.createElement('div');
            dcre.id="dcreneau_"+ardv["n_action_orig"];
            dcre.style.top=arrayAttributeTop[i]+"px";
            if(top)dcre.style.borderTop="1px solid #ccc";
            if(dispo==0){
                dcre.className='creneau_day';
                var nbrc=Math.round(nbrl*this.ag_duree_rdv_std/duree);
                var lhcre=this.lheight*duree/this.ag_duree_rdv_std+(duree/this.ag_duree_rdv_std-1);
                var tx="<ul style='list-style:none;margin:0;padding:0;'>";
                for(var k=0;k<nbrc;k++){
                    var dte=jd2my(new Date(ddeb.getTime()+k*duree*60*1000));
                    tx+="<li onClick=\""+this.ref+".oparent.fopen_rdv('"+dte+"', 0, "+duree+")\" style='border-bottom:1px solid #ccc;overflow:hidden;height:"+lhcre+"px;line-height:"+lhcre+"px;background:"+bgclr+"'>";
                    tx+="<span dte='"+dte+"' style='position:relative;top:0;left:"+(this.lheight-5)+"px;width:99%;height:100%;background:#fafafa;float:left;text-align:center;'>"+ardv["txt"]+"</span>";
                    tx+="</li>";
                }
                tx+="</ul>";
                dcre.innerHTML=tx;
            }else{
                dcre.className='creneau_indispo_day';
                dcre.style.backgroundColor=bgclr;
                dcre.innerHTML=ardv["txt"];
                dcre.style.height=(nbrl*this.lheight+nbrl+1)+"px";
            }
            
            arrayW[i].appendChild(dcre);
        }
	}
}

cday.prototype.fdt2id=function(y,m,d,h,i){
	var tx=this.pref;
	tx+=y+"_";
	tx+=(m>9 ? "" : "0")+m+"_";
	tx+=(d>9 ? "" : "0")+d+"_";
	tx+=(h>9 ? "" : "0")+h+"_";
	tx+=(i>9 ? "" : "0")+i;	
	return tx;
}

cday.prototype.ftouchstart=function(e){
	if(!this.allow_scr){
		e.stopPropagation();
		return;
	}
	this.hday.className='day';
	this.offsetY=e.touches[0].pageY;
	this.offsetX=e.touches[0].pageX;
	if(this.offsetX<20)return;
	this.tra=true;
}

cday.prototype.ftouchmove=function(e){
	this.oparent.faction_end();
	if(typeof(oconsole)!="undefined" && oconsole.nav_open)return;
	if(!this.tra)return;
	if(Math.abs(e.touches[0].pageX-this.offsetX)<=2*Math.abs(e.touches[0].pageY-this.offsetY)){
		this.dra=false;
		return;
	}
	e.stopPropagation();
	e.preventDefault();
	this.moveleft=e.touches[0].pageX-this.offsetX+this.offsetLeft;	
	this.hday.style.WebkitTransform="translate3d("+this.moveleft+"px, 0, 0)";
}

cday.prototype.ftouchend=function(e){
	if(!this.tra)return;	
	this.hday.className='day transition';
	if(this.moveleft-this.offsetLeft>70){
		var dte=new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date-1);
		this.oparent.current_annee=dte.getFullYear();
		this.oparent.current_mois=dte.getMonth()+1;
		this.oparent.current_date=dte.getDate();
		
		this.offsetLeft=this.offsetLeft+wwin-1;
		dte=new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date-2);
		this.oparent.fget_local_rdvs(dte);
		this.fadd_new_day(0);
	}else if(this.moveleft-this.offsetLeft<-70){
		var dte=new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date+1);
		this.oparent.current_annee=dte.getFullYear();
		this.oparent.current_mois=dte.getMonth()+1;
		this.oparent.current_date=dte.getDate();
		
		this.offsetLeft=this.offsetLeft-wwin+1;
		dte=new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date+2);
		this.oparent.fget_local_rdvs(dte);
		this.fadd_new_day(1);
	}
	
	if(this.oparent.hag_select){
		var awkd=new Array("Lun.","Mar.","Mer.","Jeu.","Ven.","Sam.","Dim.");
		var day=new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date).getDay();
		if(day==0)day=7;
		this.oparent.hag_select.innerHTML=awkd[day-1]+" "+this.oparent.current_date+" "+amois[this.oparent.current_mois-1]+" "+this.oparent.current_annee;
	}
	//console.log(this.oparent.current_annee+"_"+this.oparent.current_mois+"_"+this.oparent.current_date);
	this.hday.style.WebkitTransform="translate3d("+this.offsetLeft+"px,0, 0)";
	this.moveleft=this.offsetLeft;
	this.tra=false;
}

cday.prototype.fadd_new_day=function(whr){//whr=0:add previous day, whr=1 add next day
	this.allow_scr=false;
	this.tbd_tmp=null;
	var dte=null;
	if(whr==0)dte=new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date-1);
	else dte=new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date+1);		
	
	this.tbd_tmp=this.fcreate_cadre(dte.getFullYear(),dte.getMonth()+1,dte.getDate());
	this.fafficher_rdvs(dte.getFullYear(),dte.getMonth()+1,dte.getDate(),this.tbd_tmp);
	setTimeout(this.ref+".fadd_new_day2("+whr+")",250);
}
cday.prototype.fadd_new_day2=function(whr){//whr=0:add previous day, whr=1 add next day
	if(whr==0){
		this.hday.removeChild(this.tbd_sui);		
		this.tbd_sui=this.tbd;			
		this.tbd=this.tbd_pre;
		this.tbd_pre=this.tbd_tmp;
		this.hday.insertBefore(this.tbd_pre,this.tbd);
	}else if(whr==1){
		this.hday.removeChild(this.tbd_pre);		
		this.tbd_pre=this.tbd;
		this.tbd=this.tbd_sui;
		this.tbd_sui=this.tbd_tmp;
		this.hday.appendChild(this.tbd_sui);
	}
	this.offsetLeft=-wwin+1;
	this.moveleft=this.offsetLeft;
	this.hday.className='day';
	this.hday.style.WebkitTransform="translate3d("+this.offsetLeft+"px, 0, 0)";
	this.allow_scr=true;
}

//agenda semaine===========================================
function cweek(_ref,_pref,_oparent,_target){
	this.ref=_ref;
	this.pref=_pref;
	this.oparent=_oparent;

	this.target=_target;
	this.finitial();	
	this.tra=false;
}

cweek.prototype.finitial=function(_target){
	if(_target)this.target=_target;
	if(!this.target)return;
	this.ag_debut_agenda=this.oparent.ag_debut_agenda;
	this.ag_fin_agenda=this.oparent.ag_fin_agenda;
	
	this.ag_duree_rdv_std=this.oparent.ag_duree_rdv_std;
	
	//trop de grille, app ralentit
	if(this.ag_duree_rdv_std==5){
		this.ag_duree_rdv_std=20;
		this.lheight=50;
	}else if(this.ag_duree_rdv_std==10){
		this.lheight=28;
		this.ag_duree_rdv_std=20;
	}else this.lheight=22;
	this.ag_nbjours=this.oparent.ag_nbjours;
	var tx="<div class='week' ontouchstart='"+this.ref+".ftouchstart(event)' ontouchmove='"+this.ref+".ftouchmove(event)' ontouchend='"+this.ref+".ftouchend(event)'></div>";
	this.target.innerHTML=tx;
	this.hweek=this.target.childNodes[0];
	this.offsetLeft=-wwin+1;
	this.hweek.style.WebkitTransform="translate3d("+this.offsetLeft+"px, 0 , 0)";
	
	var nbrow=(this.ag_fin_agenda-this.ag_debut_agenda)*60/this.ag_duree_rdv_std;
	if((this.hweek.offsetHeight-20)/nbrow>this.lheight)this.lheight=(this.hweek.offsetHeight-25)/nbrow;
	
	//creer cadre d'agenda de mois precedent
	var dte=new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date-7);		
	this.tbw_pre=this.fcreate_cadre(dte.getFullYear(),dte.getMonth()+1,dte.getDate());
	this.hweek.appendChild(this.tbw_pre);
	this.fafficher_rdvs(dte.getFullYear(),dte.getMonth()+1,dte.getDate());
	
	//creer cadre d'agenda de mois corrant
	this.tbw=this.fcreate_cadre(this.oparent.current_annee,this.oparent.current_mois,this.oparent.current_date);
	this.hweek.appendChild(this.tbw);
	this.fafficher_rdvs(this.oparent.current_annee,this.oparent.current_mois,this.oparent.current_date);
	
	//creer cadre d'agenda de mois suivant
	dte=new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date+7);		
	this.tbw_sui=this.fcreate_cadre(dte.getFullYear(),dte.getMonth()+1,dte.getDate());
	this.hweek.appendChild(this.tbw_sui);
	this.fafficher_rdvs(dte.getFullYear(),dte.getMonth()+1,dte.getDate());
	this.allow_scr=true;
}

cweek.prototype.fcreate_cadre=function(y,m,d){
	var awkd=new Array("LUN.","MAR.","MER.","JEU.","VEN.","SAM.","DIM.");
	var aday=fget_week_days(y,m,d);
	
	var tbw=document.createElement("div");
	var tx="<table class='week_title'><tr><td style='width:38px;'></td>";
	for(var i=0;i<this.ag_nbjours;i++){
		tx+="<td id='wd_"+aday[i].getFullYear()+"_"+(aday[i].getMonth()+1)+"_"+aday[i].getDate()+"' style='width:"+((wwin-21)/this.ag_nbjours)+"px;'>"+awkd[i]+aday[i].getDate()+"</td>";			
	}
	tx+="</tr></table>";
	tx+="<div class='ctn'>";
	tx+="<table>";
	for(var h=0;h<24*60/this.ag_duree_rdv_std;h++){
		if(h<this.ag_debut_agenda*60/this.ag_duree_rdv_std || h>this.ag_fin_agenda*60/this.ag_duree_rdv_std-1)continue;
		var hre=Math.floor(h*this.ag_duree_rdv_std/60);
		if(hre<10) hre='0'+hre;
		var min=Math.round((h*this.ag_duree_rdv_std/60-hre)*60);
		if(min<10) min='0'+min;
		var str_hr=hre+':'+min;
		tx+="<tr><td class='tdHoursMinutes' style='height:"+(this.lheight-2)+"px;'><div>"+str_hr+"</div></td>";
		for(var b=0;b<this.ag_nbjours;b++){
			var dtid=this.fdt2id(aday[b].getFullYear(),aday[b].getMonth()+1,aday[b].getDate(),+hre,+min);
			var jdte=new Date(aday[b].getFullYear(),aday[b].getMonth(),aday[b].getDate(),+hre,+min)
			var dte=jd2my(jdte);
			var hpast="";
			var now=new Date();
			if(h==this.ag_debut_agenda*60/this.ag_duree_rdv_std && jdte.getTime()<now.getTime()){
				if(now.getFullYear()==jdte.getFullYear() && now.getMonth()==jdte.getMonth() 
				  && now.getDate()==jdte.getDate() && now.getHours()<this.ag_fin_agenda)var nbrl=Math.floor(((now.getHours()-this.ag_debut_agenda)*60+now.getMinutes())/this.ag_duree_rdv_std);
				else var nbrl=(this.ag_fin_agenda-this.ag_debut_agenda)*60/this.ag_duree_rdv_std;
				var ht=(this.lheight+1)*nbrl;
				if(ht>0)hpast="<div class='past' style='height:"+ht+"px;'></div>"
			}
			tx+="<td class='tdRdv' onClick=\""+this.ref+".oparent.fopen_rdv('"+dte+"')\" " +
				"ontouchstart=\""+this.ref+".oparent.faction_start(event)\" " +
				"ontouchend=\""+this.ref+".oparent.faction_end()\" " +
				"id='"+dtid+"' dte='"+dte+"' nbrdv=0 style='height:"+(this.lheight-2)+"px;'>"+hpast+"</td>";
		}
		tx+="</tr>";
	}
	tx+="</table>";
	tx+="</div>";
	tbw.innerHTML=tx;
	return tbw;
}

cweek.prototype.fafficher_rdvs=function(y,m,d,tbw){
	var aday=fget_week_days(y,m,d);
	var acreneaux=this.oparent.acreneaux[aday[0].getFullYear()+"_"+(aday[0].getMonth()+1)+"_"+aday[0].getDate()];
	if(acreneaux){
        for(var i in acreneaux) {
            var creneau = acreneaux[i];
            this.fafficher_un_rdv(creneau,tbw);
        }
	}
	
	var ardvs=this.oparent.ardvs[aday[0].getFullYear()+'_'+(aday[0].getMonth()+1)];
	
	if(ardvs){
		
		for(var i in ardvs){
			
			if (ardvs[i].ddeb != "" && my2jd(ardvs[i].ddeb).getTime() >= aday[0].getTime() &&
				ardvs[i].dfin != "" && my2jd(ardvs[i].dfin).getTime() <= aday[6].getTime()) {
				
				this.fafficher_un_rdv(ardvs[i],tbw);
			}
		}
	}	
	if(aday[0].getMonth()==aday[6].getMonth())return;
	ardvs=this.oparent.ardvs[aday[6].getFullYear()+'_'+(aday[6].getMonth()+1)];
	if(ardvs){		
		for(var i in ardvs){
			
			if (ardvs[i].ddeb != "" && my2jd(ardvs[i].ddeb).getTime() >= aday[0].getTime() &&
				ardvs[i].dfin != "" && my2jd(ardvs[i].dfin).getTime() <= aday[6].getTime()) {
				
				this.fafficher_un_rdv(ardvs[i],tbw);
			}
		}
	}	
}

cweek.prototype.fafficher_un_rdv=function(ardv,tbw){
	//si consigne du jour
	if(ardv["n_tp_action"]==5){
		var reg=new RegExp("[: -]",'g');
		var adtc=ardv["ddeb"].split(reg);
		var cid="wd_"+(+adtc[0])+"_"+(+adtc[1])+"_"+(+adtc[2]);
		if(!tbw)var hcons=document.getElementById(cid);
		else var hcons=tbw.querySelector('#'+cid);
		if(hcons){
			if(ardv["old"] || !ardv["txt"]){
				hcons.style.background='';
				hcons.removeAttribute('onClick');
			}else{
				hcons.style.background='#FFFFCC';
				hcons.setAttribute('onClick',this.oparent.ref+".fopen_consigne('"+ardv.ddeb+"',"+ardv.n_action_orig+")");
			}
		}
		return;
	}
	
	//si rdv
	var welm=null;
	if(ardv["sous_tp"]<3)welm=document.getElementById("wrdv_"+ardv["n_action_orig"]);
	else welm=document.getElementById("wcreneau_"+ardv["n_action_orig"]);
	if(welm){
		//if(ardv["n_tp_action"]==20)return;
		if(ardv["sous_tp"]<3){
			var nbrdv=+welm.parentNode.getAttribute("nbrdv");
			welm.parentNode.setAttribute("nbrdv",nbrdv-1);
		}
		welm.parentNode.removeChild(welm);
	}
	if(ardv["n_tp_action"]==22)return;		
	if(Math.abs(my2jd(ardv["ddeb"]).getTime()-new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date).getTime())>1000*60*60*24*14)return;
	
    var diffDays = dateDiff(my2jd(ardv["ddeb"]).setHours(0,0,0,0),my2jd(ardv["dfin"]).setHours(0,0,0,0));
    
    var arrayW = new Array();
    
    for (var i = 0; i <= diffDays.day; i++) {
        
        var wTemp = null;
        
        var reg = new RegExp("[: -]","g");
        
        if (i > 0) {
            var date = addDays(my2jd(ardv["ddeb"]).setHours(this.ag_debut_agenda), i); // rajoute i nombre de jours
        } else {
            var date = my2jd(ardv["ddeb"]);
        }
        
        var adt = formatDate(date).split(reg);
        
        if(+adt[3]<this.ag_debut_agenda){
            adt[3]=this.ag_debut_agenda<10 ? "0"+this.ag_debut_agenda : this.ag_debut_agenda;
            adt[4]="00";
        }
        
        var wid=this.pref+adt[0]+"_"+adt[1]+"_"+adt[2]+"_"+adt[3]+"_"+adt[4];
        if(!tbw)var wTemp=document.getElementById(wid);
        else var wTemp=tbw.querySelector('#'+wid);
        var top=0;
        
        if(!wTemp){
            for(var k=0;k<=this.ag_duree_rdv_std;k++){
                top=Math.floor((k+1)*this.lheight/this.ag_duree_rdv_std);
                wid=this.fdt2id(adt[0],+adt[1],+adt[2],+adt[3],+adt[4]-k-1)
                if(!tbw)wTemp=document.getElementById(wid);
                else wTemp=tbw.querySelector('#'+wid);
                if(wTemp)break;
            }
        }
        
        if (wTemp)
            arrayW.push(wTemp);
    }
	
	if(+ardv["sous_tp"]<3){
        
        
        var reg=new RegExp("[: -]","g");
        var adt=ardv["ddeb"].split(reg);
        if(+adt[3]<this.ag_debut_agenda){
            adt[3]=this.ag_debut_agenda<10 ? "0"+this.ag_debut_agenda : this.ag_debut_agenda;
            adt[4]="00";
        }
        var wid=this.pref+adt[0]+"_"+adt[1]+"_"+adt[2]+"_"+adt[3]+"_"+adt[4];
        if(!tbw)var w=document.getElementById(wid);
        else var w=tbw.querySelector('#'+wid);
        var top=0;
        
        if(!w){
            for(var k=0;k<=this.ag_duree_rdv_std;k++){
                top=Math.floor((k+1)*this.lheight/this.ag_duree_rdv_std);
                wid=this.fdt2id(adt[0],+adt[1],+adt[2],+adt[3],+adt[4]-k-1)
                if(!tbw)w=document.getElementById(wid);
                else w=tbw.querySelector('#'+wid);
                if(w)break;
            }
        }
        if(!w)return;

        
		var nbrl=(my2jd(ardv["dfin"]).getTime()-my2jd(ardv["ddeb"]).getTime())/(1000*60*this.ag_duree_rdv_std);
		var wrdv=document.createElement('div');
		wrdv.className='rdv_week';
		wrdv.setAttribute('dte',ardv["ddeb"]);
		wrdv.setAttribute('onClick',this.oparent.ref+".fshow_detail_rdv('"+ardv.ddeb+"',"+ardv.n_action_orig+")");
		var txrdv="";
		switch(+ardv["pasvenu"]){
			case 1:
				wrdv.style.textDecoration='line-through';
			break;
			case 2:
				txrdv+="<span style='color:#C80000;'>(P)</span>";
			break;
			case 3:
				txrdv+="<span style='color:#505050;'>(A)</span>";
			break;
		}
		if(ardv["depl"]==1)wrdv.style.color='#FF3399';
		wrdv.innerHTML=txrdv+(ardv["nv_client"]==1 ? "<span style='color:#A00000;'>(N)</span> " : "")+
					   (ardv["vis"]==1 ? "<span style='color:#FF6633;'>(V)</span> " : "")+
					   (ardv["webag"]==1 ? "<span style='color:#336600;'>(W)</span> " : "")+
					   ((ardv["sous_tp"]==1 && user.n!=this.oparent.ncli) ? "Privé" : ardv["objet"]);
		wrdv.id="wrdv_"+ardv["n_action_orig"];
		wrdv.style.height=(nbrl*this.lheight+nbrl-2)+"px";
		wrdv.style.top=top+"px";
		
		var nbrdv=+w.getAttribute("nbrdv");
		var rl=(wwin-21)/this.ag_nbjours;
		if(top==0 && this.ag_duree_rdv_std==this.oparent.ag_duree_rdv_std){
			wrdv.style.width=((wwin-21)/this.ag_nbjours-7-nbrdv*rl/(nbrdv+2))+"px";
		}else{
			wrdv.style.width=((wwin-21)/this.ag_nbjours-7)+"px";
		}
		
		if(ardv["catcouleur"])wrdv.style.backgroundColor=ardv["catcouleur"];
		else if(ardv["sous_tp"]==1)wrdv.style.backgroundColor='orange';
		else if(this.oparent.tpmotifs && this.oparent.tpmotifs[ardv.nmotif])wrdv.style.backgroundColor=this.oparent.tpmotifs[ardv.nmotif]["couleur"];
		else if(this.oparent.rdvcolor)wrdv.style.backgroundColor=this.oparent.rdvcolor;
        
        w.appendChild(wrdv);
        w.setAttribute("nbrdv",nbrdv+1);
		
	} else {
        
        for (var i = 0; i < arrayW.length; i++) {
			
            if (i > 0) {
                var ddeb = addDays(my2jd(ardv["ddeb"]).setHours(this.ag_debut_agenda), i);
            } else {
                var ddeb = my2jd(ardv["ddeb"]);
            }
            
            var dfin=my2jd(ardv["dfin"]);
            
            var dtd_min = addDays(my2jd(ardv["ddeb"]), i);
            dtd_min.setHours(this.ag_debut_agenda);
            dtd_min.setMinutes(0);
            if(my2jd(ardv["ddeb"]).getTime()<dtd_min.getTime())ddeb=dtd_min;
            
            var dtf_max = addDays(my2jd(ardv["ddeb"]), i);
            dtf_max.setHours(this.ag_fin_agenda);
            dtf_max.setMinutes(0);
            if(my2jd(ardv["dfin"]).getTime()>dtf_max.getTime())dfin=dtf_max;
            
            var nbrl=Math.ceil((dfin.getTime()-ddeb.getTime())/(1000*60*this.ag_duree_rdv_std));
            if(!this.oparent.tpcreneaux)return;

			var bgclr=ardv.catcouleur;
			
			var dureeCreneau = 0;
			
			if (this.oparent.tpcreneaux[ardv.nmotif]) {
				// On récupère la durée du créneau via le motif
				dureeCreneau = this.oparent.tpcreneaux[ardv.nmotif]["duree"];
			} else if (ardv.temps_traitement && ardv.temps_traitement != 0) {
				// On se base sur le temps_traitement (nouvelle colonne ajoutée dans l'app version 2.1.6)
				dureeCreneau = ardv.temps_traitement;
			} else {
				// On calcule la durée du créneau
				dureeCreneau = ((my2jd(ardv["dfin"]).getTime()-my2jd(ardv["ddeb"]).getTime()) / 60000); // Durée du créneau en minutes
			}
			
			var duree=+dureeCreneau;
			
            if(duree==0)duree=this.oparent.ag_duree_rdv_std;
            else if(duree<10)duree=10;
			var dispo=ardv.dispo;
            var wcre=document.createElement('div');
            wcre.id="wcreneau_"+ardv["n_action_orig"];
            wcre.style.top=top+"px";
            if(top)wcre.style.borderTop="1px solid #ccc";
            if(dispo==0){
                wcre.className='creneau_week';
                var nbrc=Math.round(nbrl*this.ag_duree_rdv_std/duree);
                var lhcre=this.lheight*duree/this.ag_duree_rdv_std+(duree/this.ag_duree_rdv_std-1);
                var tx="<ul style='list-style:none;margin:0;padding:0;'>";
                for(var k=0;k<nbrc;k++){
                    var dte=jd2my(new Date(ddeb.getTime()+k*duree*60*1000));
                    tx+="<li onClick=\""+this.ref+".oparent.fopen_rdv('"+dte+"', 0, "+duree+")\" style='border-bottom:1px solid #ccc;overflow:hidden;height:"+lhcre+"px;line-height:"+lhcre+"px;background:"+bgclr+"'>";
                    tx+="<span dte='"+dte+"' style='position:relative;top:0;left:4px;width:99%;height:100%;background:#f5f5f5;float:left;text-align:center;'>"+ardv["txt"]+"</span>";
                    tx+="</li>";
                }
                tx+="</ul>";
                wcre.innerHTML=tx;
            }else{
                wcre.className='creneau_indispo_week';
                wcre.style.backgroundColor=bgclr;
                wcre.innerHTML=ardv["txt"];
                wcre.style.height=(nbrl*this.lheight+nbrl+1)+"px";
            }
            arrayW[i].appendChild(wcre);

        }
	}
}

cweek.prototype.fdt2id=function(y,m,d,h,i){
	var tx=this.pref;
	tx+=y+"_";
	tx+=(m>9 ? "" : "0")+m+"_";
	tx+=(d>9 ? "" : "0")+d+"_";
	tx+=(h>9 ? "" : "0")+h+"_";
	tx+=(i>9 ? "" : "0")+i;	
	return tx;
}

cweek.prototype.ftouchstart=function(e){
	if(!this.allow_scr){
		e.stopPropagation();
		return;
	}
	this.hweek.className='week';
	this.offsetY=e.touches[0].pageY;
	this.offsetX=e.touches[0].pageX;
	if(this.offsetX<20)return;
	this.tra=true;
}

cweek.prototype.ftouchmove=function(e){
	this.oparent.faction_end();
	if(typeof(oconsole)!="undefined" && oconsole.nav_open)return;
	if(!this.tra)return;
	if(Math.abs(e.touches[0].pageX-this.offsetX)<=2*Math.abs(e.touches[0].pageY-this.offsetY)){
		this.dra=false;
		return;
	}
	e.stopPropagation();
	e.preventDefault();
	this.moveleft=e.touches[0].pageX-this.offsetX+this.offsetLeft;	
	if(device=='iPhone' || device=='iPad')this.hweek.style.WebkitTransform="translate3d("+this.moveleft+"px, 0, 0)";
}

cweek.prototype.ftouchend=function(e){
	if(!this.tra)return;	
	this.hweek.className='week transition';
	if(this.moveleft-this.offsetLeft>50){
		var dte=new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date-7);
		this.oparent.current_annee=dte.getFullYear();
		this.oparent.current_mois=dte.getMonth()+1;
		this.oparent.current_date=dte.getDate();
		
		this.offsetLeft=this.offsetLeft+wwin-1;
		dte=new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date-14);
		this.oparent.fget_local_rdvs(dte);
		this.fadd_new_week(0);
	}else if(this.moveleft-this.offsetLeft<-50){
		var dte=new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date+7);
		this.oparent.current_annee=dte.getFullYear();
		this.oparent.current_mois=dte.getMonth()+1;
		this.oparent.current_date=dte.getDate();
		
		this.offsetLeft=this.offsetLeft-wwin+1;
		dte=new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date+14);
		this.oparent.fget_local_rdvs(dte);
		this.fadd_new_week(1);
	}	
	if(this.oparent.hag_select)this.oparent.hag_select.innerHTML=amois[this.oparent.current_mois-1]+" "+this.oparent.current_annee;
	//console.log(this.oparent.current_annee+"_"+this.oparent.current_mois+"_"+this.oparent.current_date);
	this.hweek.style.WebkitTransform="translate3d("+this.offsetLeft+"px,0, 0)";
	this.moveleft=this.offsetLeft;
	this.tra=false;
}

cweek.prototype.fadd_new_week=function(whr){
	this.allow_scr=false;
	this.tbw_tmp=null;
	var dte=null;
	if(whr==0)dte=new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date-7);
	else dte=new Date(this.oparent.current_annee,this.oparent.current_mois-1,this.oparent.current_date+7);		
	
	this.tbw_tmp=this.fcreate_cadre(dte.getFullYear(),dte.getMonth()+1,dte.getDate());
	this.fafficher_rdvs(dte.getFullYear(),dte.getMonth()+1,dte.getDate(),this.tbw_tmp);
	setTimeout(this.ref+".fadd_new_week2("+whr+")",220);
}

cweek.prototype.fadd_new_week2=function(whr){//whr=0:add previous month, whr=1 add next month
	if(whr==0){
		this.hweek.removeChild(this.tbw_sui);		
		this.tbw_sui=this.tbw;			
		this.tbw=this.tbw_pre;
		this.tbw_pre=this.tbw_tmp;
		this.hweek.insertBefore(this.tbw_pre,this.tbw);
	}else if(whr==1){
		this.hweek.removeChild(this.tbw_pre);		
		this.tbw_pre=this.tbw;
		this.tbw=this.tbw_sui;
		this.tbw_sui=this.tbw_tmp;
		this.hweek.appendChild(this.tbw_sui);
	}
	this.offsetLeft=-wwin+1;
	this.moveleft=this.offsetLeft;
	this.hweek.className='week';
	this.hweek.style.WebkitTransform="translate3d("+this.offsetLeft+"px, 0, 0)";
	this.allow_scr=true;
}

//agenda mensuel===========================================
function cmensuel(_ref,_pref,_oparent,_target){
	this.ref=_ref;
	this.pref=_pref;
	this.oparent=_oparent;

	this.target=_target;
	this.finitial();
	
	this.tra=false;
}

cmensuel.prototype.finitial=function(_target){
	if(_target)this.target=_target;
	if(!this.target)return;
	var tx="<table class='week_title'><tr><td>LUN.</td><td>MAR.</td><td>MER.</td><td>JEU.</td><td>VEN.</td><td>SAM.</td><td>DIM.</td></tr></table>";
	tx+="<div class='mensuel'>" +
		"<div class='ctn' ontouchstart='"+this.ref+".ftouchstart(event)' ontouchmove='"+this.ref+".ftouchmove(event)' ontouchend='"+this.ref+".ftouchend(event)'></div>" +
		"</div>";
	this.target.innerHTML=tx;
	this.hmen=this.target.childNodes[1].childNodes[0];
	
	this.htb=this.target.childNodes[1].offsetHeight-1;
	this.offsetTop=-this.htb;
	this.hmen.style.WebkitTransform="translate3d(0,"+this.offsetTop+"px, 0)";
	this.nbr_rdv_aff=Math.floor(this.htb/6/12);
	
	//creer cadre d'agenda de mois president
	var dte=new Date(this.oparent.current_annee,this.oparent.current_mois-2,this.oparent.current_date);
	this.tbm_pre=this.fcreate_cadre(dte.getFullYear(),dte.getMonth()+1);
	this.hmen.appendChild(this.tbm_pre);
	this.fafficher_rdvs(dte.getFullYear(),dte.getMonth()+1);
	
	//creer cadre d'agenda de mois corrant
	this.tbm=this.fcreate_cadre(this.oparent.current_annee,this.oparent.current_mois);
	this.hmen.appendChild(this.tbm);
	this.fafficher_rdvs(this.oparent.current_annee,this.oparent.current_mois);
	
	//creer cadre d'agenda de mois suivant
	dte=new Date(this.oparent.current_annee,this.oparent.current_mois,this.oparent.current_date);
	this.tbm_sui=this.fcreate_cadre(dte.getFullYear(),dte.getMonth()+1);
	this.hmen.appendChild(this.tbm_sui);
	this.fafficher_rdvs(dte.getFullYear(),dte.getMonth()+1);
	this.allow_scr=true;
}

cmensuel.prototype.fcreate_cadre=function(y,m){
	var mdays=new Date(y,m,0).getDate();
	var tbm=document.createElement("table");
	var k=1;
	var k_svt=1;
	var first_md=new Date(y,m-1,1).getDay();
	if(first_md==0)first_md=7;
	var tx="";
	for(var i=0;i<6;i++){
		tx+="<tr>";
		for(var j=1;j<8;j++){
			if(i*7+j>=first_md && k<=mdays){
				tx+="<td id='"+this.fdt2id(y,m,k)+"' dte='"+y+"-"+m+"-"+k+"' onClick='"+this.ref+".fshow_rdvs_jour(this)'>";
				if(y==new Date().getFullYear() && m-1==new Date().getMonth() && k==new Date().getDate())tx+="<span style='font-weight:bold;color:blue;'>"+k+"</span>";
				else tx+=k;
				k++;
			}else if(k<mdays){//afficher au debut les derniers jours du mois president
				if(m==1){
					var k_pre=new Date(y-1,12,0).getDate()-first_md+j+1;
					var dte_id=this.fdt2id(y-1,12,k_pre);
				}else{
					var k_pre=new Date(y,m-1,0).getDate()-first_md+j+1;
					var dte_id=this.fdt2id(y,m-1,k_pre);
				}
				tx+="<td id='"+dte_id+"_fake' style='color:#778899;background:#E8E8E8;'>";
				tx+=k_pre;
			}else{//afficher a la fin les premeres jours du mois suivant
				if(m==12)var dte_id=this.fdt2id(y+1,1,k_svt);
				else var dte_id=this.fdt2id(y,m+1,k_svt);
				tx+="<td id='"+dte_id+"_fake' style='color:#778899;background:#E8E8E8;'>";
				tx+=k_svt;
				k_svt++;
			}

			tx+="</td>";
		}
		tx+="</tr>";
	}
	tbm.innerHTML=tx;
	return tbm;
}

cmensuel.prototype.fshow_rdvs_jour=function(obj){
	if(this.act_jour)this.act_jour.className="";
	this.act_jour=obj;
	this.act_jour.className="selected";
	
	var reg=new RegExp("[: -]","g");	
	var dte=obj.getAttribute('dte');
	if(!dte)return;
	var adt=dte.split(reg);
	
	var ar=new Array();
	if(this.oparent.ardvs[adt[0]+'_'+adt[1]]){
		var ardvs=this.oparent.ardvs[adt[0]+'_'+adt[1]];
		for(var i in ardvs){
			if(ardvs[i].sous_tp>2)continue;
			var addeb=ardvs[i].ddeb.split(reg);
			if((+addeb[0])!=(+adt[0]) || (+addeb[1])!=(+adt[1]) || (+addeb[2])!=(+adt[2]))continue;
			for(var k=0;k<100;k++){
				var ind=((+addeb[3])*60+(+addeb[4]))*100+k;
				if(!ar[ind]){
					ar[ind]=ardvs[i];
					break;
				}
			}
			
		}
	}
	
	var tx="<div class='mensuel_jour_title'>"+jd2fr2(my2jd(dte))+"</div>" +
			"<div class='mensuel_jour' style='max-height:"+(this.htb/2-10)+"px;' ontouchstart='event.stopPropagation()'>";
	if(ar.length==0)tx+="<p>Pas de rendez-vous.</p>";
	else{
		for(var i in ar){
			var bgclr=this.oparent.rdvcolor;
			if(ar[i]["sous_tp"]==1)bgclr='orange';
			else if(this.oparent.tpmotifs && this.oparent.tpmotifs[ar[i].nmotif])bgclr=this.oparent.tpmotifs[ar[i].nmotif]["couleur"];
			
			var divRdvMensuel=document.createElement('div');
			
			divRdvMensuel.className = "divRdvMensuel";
			divRdvMensuel.setAttribute('onClick',this.oparent.ref+".fshow_detail_rdv('"+ar[i]["ddeb"]+"',"+ar[i]["n_action_orig"]+")");
			divRdvMensuel.style.borderLeft = "4px solid "+bgclr;
			
			var adb=ar[i].ddeb.split(reg);
			var txtRdv = adb[3]+":"+adb[4]+" ";
			txtRdv += (ar[i]["nv_client"]==1 ? "<span style='color:#A00000;'>(N)</span> " : "")+
				(ar[i]["vis"]==1 ? "<span style='color:#FF6633;'>(V)</span> " : "")+
				(ar[i]["webag"]==1 ? "<span style='color:#336600;'>(W)</span> " : "")+
				((ar[i]["sous_tp"]==1 && user.n!=this.oparent.ncli) ? "Privé" : ar[i]["objet"]);
			
			divRdvMensuel.innerHTML += "<p>"+txtRdv+"</p>";
			
			tx += divRdvMensuel.outerHTML;
		}
	}
		
	tx+="</div>";
    
    // Date cellule
    var jdte = my2jd(dte);
    // Date courante
    var jdateToday = new Date().setHours(0,0,0,0);
    
    // Si la date de la cellule est postérieur ou égale à la date courante
    if (jdte >= jdateToday) {
        // Heure par défaut : 9h
        dte = dte + " 09:00:00";
        // On affiche un ligne pour pouvoir ajouter un rendez vous
        tx+="<div class='mensuel_ajouter_rdv' onClick=\""+this.ref+".oparent.fopen_rdv('"+dte+"')\"><p style='font-weight: bold;'>Nouveau rendez-vous</p></div>";
    }
    
	fcontext_menu(obj,tx,wwin*0.7);
}

cmensuel.prototype.fdt2id=function(y,m,d){
	//var tx="m"+this.oparent.pref;
	var tx=this.pref;
	tx+=y+"_";
	tx+=(m>9 ? "" : "0")+m+"_";
	tx+=(d>9 ? "" : "0")+d;
	return tx;
}

cmensuel.prototype.fafficher_rdvs=function(y,m,tbm){
	if(this.oparent.ardvs[y+'_'+m]){
		var ardvs=this.oparent.ardvs[y+'_'+m];
		for(var i in ardvs)this.fafficher_un_rdv(ardvs[i],tbm);
	}
}

cmensuel.prototype.fafficher_un_rdv=function(ardv,tbm){
	if(ardv["n_tp_action"]==5)return;
	if(+ardv["sous_tp"]>2)return;
	var mrdv_old=document.getElementById("mrdv_"+ardv["n_action_orig"]);
	if(mrdv_old){
		if(ardv["n_tp_action"]==20)return;
		mrdv_old.parentNode.removeChild(mrdv_old);
	}
	if(ardv["n_tp_action"]==22)return;//rdv supprime
	
	
	var reg=new RegExp("[: -]","g");
	var adt=ardv["ddeb"].split(reg);
	var mid=this.pref+adt[0]+"_"+adt[1]+"_"+adt[2];
	if(!tbm)var m=document.getElementById(mid);
	else var m=tbm.querySelector('#'+mid);
	if(!m)return;
	var mrdv=document.createElement('div');
	mrdv.id="mrdv_"+ardv["n_action_orig"];
	
	mrdv.innerHTML=(ardv["nv_client"]==1 ? "<span style='color:#A00000;'>(N)</span> " : "")+
				   (ardv["vis"]==1 ? "<span style='color:#FF6633;'>(V)</span> " : "")+
				   (ardv["webag"]==1 ? "<span style='color:#336600;'>(W)</span> " : "")+
				   ((ardv["sous_tp"]==1 && user.n!=this.oparent.ncli) ? "Privé" : ardv["objet"]);
	mrdv.className="rdv_mensuel";
	var hre_rdv=(+adt[3])*60+(+adt[4]);
	mrdv.setAttribute("hre_rdv",hre_rdv);
	
	if(ardv["catcouleur"])mrdv.style.backgroundColor=ardv["catcouleur"];
	else if(ardv["sous_tp"]==1)mrdv.style.backgroundColor='orange';
	else if(this.oparent.tpmotifs && this.oparent.tpmotifs[ardv.nmotif])mrdv.style.backgroundColor=this.oparent.tpmotifs[ardv.nmotif]["couleur"];
	else if(this.oparent.rdvcolor)mrdv.style.backgroundColor=this.oparent.rdvcolor;
	
	var elm=null;
	for(var i=1;i<m.childNodes.length;i++){
		if(+m.childNodes[i].getAttribute("hre_rdv")>hre_rdv){
			elm=m.childNodes[i];
			break;
		}
	}
	if(elm){
		m.insertBefore(mrdv,elm);
		if(m.childNodes.length>this.nbr_rdv_aff+1)m.removeChild(m.lastChild);
	}else{
		if(m.childNodes.length>this.nbr_rdv_aff)return;
		m.appendChild(mrdv);
	}	
}

cmensuel.prototype.ftouchstart=function(e){
	if(!this.allow_scr){
		e.stopPropagation();
		return;
	}
	this.tra=true;
	this.hmen.className='ctn';
	this.offsetY=e.touches[0].pageY;
	this.offsetX=e.touches[0].pageX;
}

cmensuel.prototype.ftouchmove=function(e){
	e.preventDefault();
	if(!this.tra)return;
	if(Math.abs(e.touches[0].pageX-this.offsetX)>Math.abs(e.touches[0].pageY-this.offsetY)){
		this.dra=false;
		return;
	}
	this.movetop=e.touches[0].pageY-this.offsetY+this.offsetTop;	
	this.hmen.style.WebkitTransform="translate3d(0,"+this.movetop+"px,  0)";
}

cmensuel.prototype.ftouchend=function(e){
	if(!this.tra)return;	
	this.hmen.className='ctn transition';
	if(this.movetop-this.offsetTop>100){
		var dte=new Date(this.oparent.current_annee,this.oparent.current_mois-2,1);
		this.oparent.current_annee=dte.getFullYear();
		this.oparent.current_mois=dte.getMonth()+1;
		this.oparent.current_date=dte.getDate();
		
		this.offsetTop=Math.ceil(this.movetop/this.htb)*this.htb-1;
		var dte=new Date(this.oparent.current_annee,this.oparent.current_mois-3,1);
		this.oparent.fget_local_rdvs(dte);
		this.fadd_new_month(0);
	}else if(this.movetop-this.offsetTop<-100){
		var dte=new Date(this.oparent.current_annee,this.oparent.current_mois,1);
		this.oparent.current_annee=dte.getFullYear();
		this.oparent.current_mois=dte.getMonth()+1;
		this.oparent.current_date=dte.getDate();
		
		this.offsetTop=Math.floor(this.movetop/this.htb)*this.htb+1;
		var dte=new Date(this.oparent.current_annee,this.oparent.current_mois+1,1);
		this.oparent.fget_local_rdvs(dte);
		this.fadd_new_month(1);
	}
	if(this.oparent.hag_select)this.oparent.hag_select.innerHTML=amois[this.oparent.current_mois-1]+" "+this.oparent.current_annee;
	//console.log(this.oparent.current_annee+"_"+this.oparent.current_mois);
	this.hmen.style.WebkitTransform="translate3d(0,"+this.offsetTop+"px, 0)";
	this.movetop=this.offsetTop;
	this.tra=false;
}

cmensuel.prototype.fadd_new_month=function(whr){//whr=0:add previous month, whr=1 add next month
	this.allow_scr=false;
	this.tbm_tmp=null;
	var dte=null;
	if(whr==0)dte=new Date(this.oparent.current_annee,this.oparent.current_mois-2,this.oparent.current_date);		
	else var dte=new Date(this.oparent.current_annee,this.oparent.current_mois,this.oparent.current_date);
	
	this.tbm_tmp=this.fcreate_cadre(dte.getFullYear(),dte.getMonth()+1);
	this.fafficher_rdvs(dte.getFullYear(),dte.getMonth()+1,this.tbm_tmp);
	setTimeout(this.ref+".fadd_new_month2("+whr+")",240);
}
cmensuel.prototype.fadd_new_month2=function(whr){//whr=0:add previous month, whr=1 add next month
	if(whr==0){
		this.hmen.removeChild(this.tbm_sui);		
		this.tbm_sui=this.tbm;			
		this.tbm=this.tbm_pre;	
		this.tbm_pre=this.tbm_tmp;
		this.hmen.insertBefore(this.tbm_pre,this.tbm);
	}else if(whr==1){
		this.hmen.removeChild(this.tbm_pre);		
		this.tbm_pre=this.tbm;
		this.tbm=this.tbm_sui;
		this.tbm_sui=this.tbm_tmp;
		this.hmen.appendChild(this.tbm_sui);
	}
	this.offsetTop=-this.htb;
	this.movetop=this.offsetTop;
	this.hmen.className='ctn';
	this.hmen.style.WebkitTransform="translate3d(0,"+this.offsetTop+"px,  0)";
	this.allow_scr=true;
}


