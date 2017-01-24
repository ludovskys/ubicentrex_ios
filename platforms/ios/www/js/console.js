function cconsole(_ref,_pref){
	this.ref=_ref;
	this.pref=_pref;
	this.agrp=new Array();
	this.nav_open=false;
	this.has_login=false;
	
	//pages
	this.main_page=null;	
	this.nav_page=null;
	this.login_page=null;
	
	this.ncli_active=null;
}

//auto login=================================
cconsole.prototype.fauto_login=function(){
	var qry="select ncb_ident,ncb_mdp from ncb_sys_contacts where ncb_ident is not null and ncb_mdp is not null and n_sys_contact_pere=0";
	odb.query(qry,this,this.fsuccess_auto_login_clb,this.ferror_auto_login_clb,"arraysimple");
}

cconsole.prototype.fsuccess_auto_login_clb=function(myobj,p){
	if(!p || !p.ncb_ident || !p.ncb_mdp){
		console.log("no user saved");
		myobj.has_login=false;
		myobj.finitial();
	}else myobj.flogin(p["ncb_ident"],p["ncb_mdp"]);
}

cconsole.prototype.ferror_auto_login_clb=function(myobj){
	myobj.fcreate_tables();
	myobj.has_login=false;
	myobj.finitial();
}

cconsole.prototype.fcreate_tables=function(){
    
	
    
}

cconsole.prototype.flogin=function(ident,mdp){
	if(typeof(ident)=="undefined" || !ident)ident=document.getElementById(this.pref+'username').value;
	if(typeof(mdp)=="undefined" || !mdp)mdp=document.getElementById(this.pref+'pwd').value;
	if(ident=='' || mdp==''){
		ftoast("Veuillez saisir un identifiant et un mot de passe.");
		return;
	}
	var req={
			ismobile:1,
			soapmethod:'user',
			act:'login',
			ncb_ident:ident,
			ncb_mdp:mdp
		}

	soap.call(req,this.flogin_clb,this,this.foffline_login);
}

cconsole.prototype.flogin_clb=function(r,rt,myobj,p){
	//alert(xmlToString(r));
	var res=r.selectSingleNode("./result");
	if(!res){
		myobj.has_login=false;
		if(!myobj.login_page){
			myobj.finitial();
			document.getElementById(myobj.pref+'username').value=p.ncb_ident;
			document.getElementById(myobj.pref+'pwd').value=p.ncb_mdp;
		}		
		ftoast("Votre identifiant ou mot de passe n'est pas valide, veuillez les vérifier et vous reconnecter.");
		return false;
	}else{
		user=xmltag2array(res);
		user.ncb_ident=p.ncb_ident;
		user.ncb_mdp=p.ncb_mdp;		
		user_droits=xmltag2array(res.selectSingleNode("./droits"));
		user.ldroits=obj2string(user_droits);
		
		if(!droit(89)){
			myobj.has_login=false;
			if(!myobj.login_page){
				myobj.finitial();
				document.getElementById(myobj.pref+'username').value=p.ncb_ident;
				document.getElementById(myobj.pref+'pwd').value=p.ncb_mdp;
			}
			ftoast("Vous n'avez pas le droit d'accéder au service, veuillez contacter votre administateur.",7000);
			return false;
		}
		
		myobj.has_login=true;
		myobj.finitial();
		//nbr des messages non lu pour l'utilisateur ou la group
		anbrmsg=xmltag2array(res.selectSingleNode("./messages"));
		
		//register id for push notification
		if(mobile_push_id){
			var req={
				soapmethod:'messagerie',
				act:'mobile_update_push_id',
				n:user.n,
				nsoc:user.nsoc,
				mobile_push_id:mobile_push_id
			}
			soap.call(req);
		}
		return true;
	}
}

//offline login=============================
cconsole.prototype.foffline_login=function(myobj){
	ftoast("Vous n'êtes pas connecté à Internet.");
	var qry="select * from ncb_sys_contacts where n_sys_contact_pere=0";
	odb.query(qry,myobj,myobj.fsuccess_offline_login_clb,myobj.ferror_offline_login_clb,"array");
}

cconsole.prototype.fsuccess_offline_login_clb=function(myobj,p){	
	for(var i in p){
		if(p[i].ncb_ident && p[i].ncb_mdp){
			user=p[i];
			user_droits=user.ldroits.split(',');
		}else myobj.agrp[p[i].n]=p[i];
	}
	myobj.fcreate_console_pages();
}

cconsole.prototype.ferror_offline_login_clb=function(myobj){
	console.log("offline login failed");
}



cconsole.prototype.finitial=function(){
	indpage=0;
	if(this.main_page){
		this.main_page.fdelete();
		this.main_page=null;
	}
	
	if(this.nav_page){
		this.nav_page.fdelete();
		this.nav_page=null;
	}
	
	if(this.login_page){
		this.login_page.fdelete();
		this.login_page=null;
	}
	
	if(this.has_login){
		this.fcreate_console();
		return true;
	}else{
		this.flogin_page();
		return false;
	}
}

cconsole.prototype.fcreate_console=function(){
	var req={
			soapmethod:'console',
			act:'display',
			ncli:user.n
		}
	soap.call(req,this.fcreate_console_clb,this);
}

cconsole.prototype.fcreate_console_clb=function(r,rt,myobj){
	myobj.fset_grp(r);
	myobj.fcreate_console_pages();
}

cconsole.prototype.fset_grp=function(r){
	var qry=new Array();
	//information of the user
	var xmlinfos=r.selectSingleNode("./data_client/contact");	
	var xmlsoc=r.selectSingleNode("./data_client/societe");	
	var xmltpcreneaux=r.selectNodes("./data_client/tpcreneaux/*");	
	var xmltpmotifs=r.selectNodes("./data_client/tpmotifs/*");
	
	user=array_merge(xmltag2array(xmlinfos),user);
	user.societe=xmltag2array(xmlsoc);
	user.nsoc=user.societe.n;
	qry.push(insert_qry("ncb_sys_contacts",user,true));
	
	//initial the configuration of the clients
	var ac=new Array();
	ac["ncli"]=user.n;
	ac["ag_last_sync"]=0;
	ac["msg_last_sync"]=0;
	ac["con_last_sync"]=0;
	ac["ag_aff"]='d';
	ac["interval_ag"]=10;
	ac["interval_msg"]=10;
	ac["interval_con"]=10;
	qry.push(insert_qry("ncb_local_config",ac));
	
	qry.push("delete from ncb_tp_creneaux where ncli="+user.n);
	qry.push("delete from ncb_tp_motifs where ncli="+user.n);
	
	user.tpcreneaux=new Array();
	user.tpmotifs=new Array();
	for(var j in xmltpcreneaux){
		var atpcreneau=xmltag2array(xmltpcreneaux[j]);
		user.tpcreneaux[atpcreneau.n]=atpcreneau;
		qry.push(insert_qry("ncb_tp_creneaux",atpcreneau));
	}
	for(var k in xmltpmotifs){
		var atpmotif=xmltag2array(xmltpmotifs[k]);
		user.tpmotifs[atpmotif.n]=atpmotif;
		qry.push(insert_qry("ncb_tp_motifs",atpmotif));
	}

	//add informations of the membres in the group of the user who is secretaire
	if(droit(26)){
		var xmlpersos=r.selectNodes("./data_client/persos/*");	
		qry.push("delete from ncb_sys_contacts where n_sys_contact_pere=0 and nsoc!="+user.nsoc);
		for(var i in xmlpersos){
			var aperso=xmltag2array(xmlpersos[i]);
			if(aperso.n==user.n)continue;
			aperso.n_sys_contact_pere=0;
			aperso.nsoc=aperso.n_sys_societes;
			qry.push(insert_qry("ncb_sys_contacts",aperso,true));
			
			//initial the configuration of the clients
			ac=new Array();
			ac["ncli"]=aperso.n;
			ac["ag_last_sync"]=0;
			ac["msg_last_sync"]=0;
			ac["con_last_sync"]=0;
			ac["ag_aff"]='d';
			ac["interval_ag"]=10;
			ac["interval_msg"]=10;
			ac["interval_con"]=10;
			qry.push(insert_qry("ncb_local_config",ac));
			
			xmltpcreneaux=xmlpersos[i].selectNodes("./tpcreneaux/*");	
			xmltpmotifs=xmlpersos[i].selectNodes("./tpmotifs/*");
			qry.push("delete from ncb_tp_creneaux where ncli="+aperso.n);
			qry.push("delete from ncb_tp_motifs where ncli="+aperso.n);
			aperso.tpcreneaux=new Array();
			aperso.tpmotifs=new Array();
			for(var j in xmltpcreneaux){
				var atpcreneau=xmltag2array(xmltpcreneaux[j]);
				aperso.tpcreneaux[atpcreneau.n]=atpcreneau;
				qry.push(insert_qry("ncb_tp_creneaux",atpcreneau));
			}
			for(var k in xmltpmotifs){
				var atpmotif=xmltag2array(xmltpmotifs[k]);
				aperso.tpmotifs[atpmotif.n]=atpmotif;
				qry.push(insert_qry("ncb_tp_motifs",atpmotif));
			}
			this.agrp[aperso.n]=aperso;
		}
	}	
	//supprimer l'histoire de rdvs
	qry.push("delete from ncb_crm_actions where (sous_tp>2 and ddeb<'"+d2my(new Date(new Date().getTime()-7*24*60*60*1000))+" 00:00:00') or ddeb<'"+d2my(new Date(new Date().getTime()-90*24*60*60*1000))+" 00:00:00'");
	odb.query(qry,this);
}

cconsole.prototype.fcreate_console_pages=function(){
	if(typeof(user)=="undefined")return;
	var a=new Array();
	
	
	//a["content"]="<img style='position:absolute;top:0px;height:25%;width:100%;Z-index:0;opacity:0.9;' />";
	
	var len=0;
	var ar=new Array();
	if(droit(4) || droit(44)){
		this.ncli_active=user.n;
		ar[user.n]=user.nom_usuel;
		len++;
	}
	
	for(var i in this.agrp){
		var ncli=this.agrp[i].n;
		if(!this.ncli_active)this.ncli_active=ncli;
		ar[ncli]=this.agrp[i].nom_usuel;				
		this.agrp[ncli]=new cgroup(this.ref+".agrp["+ncli+"]",this.pref+"agrp"+ncli,this,this.agrp[i]);//transform every group array to group object
		len++;
	}
	this.agrp[user.n]=new cgroup(this.ref+".agrp["+user.n+"]",this.pref+"agrp"+user.n,this,user);
	
	a["content"]="<div class='divContentMenu'>";
	a["content"]+="<a onClick=\""+this.ref+".fsync_config("+this.ref+".ncli_active)\" class='linkProfileMenu'> </a>";
	a["content"]+="<div class='divSelectUser'>";
	if(droit(26) && len>1){
		this.users_select=new cselect(this.ref+".users_select","users_select",ar,this.ncli_active,this.ref+".fonchange_client");
		a["content"]+=this.users_select.fcreate();
	}else{
		a["content"]+=" <u class='uNomUsuel'>"+this.agrp[this.ncli_active].nom_usuel+"</u>";
	}
	a["content"]+="</div>";	
	a["content"]+="<ul class='ulMenu'>" +
				"<li class='title'>Favoris</li>" +
				"<li style=\"background-image:url('img/icon_search2.png')\" onclick=\""+this.ref+".fonchange_action('search')\" ontouchstart=\"this.style.color='orange'\" ontouchend=\"this.style.color=''\"><a>Rechercher</a></li>" +
				"<li style=\"background-image:url('img/icon_calendar.png')\" onclick=\""+this.ref+".fonchange_action('agenda')\" ontouchstart=\"this.style.color='orange'\" ontouchend=\"this.style.color=''\"><a>Planning</a></li>" +
				"<li style=\"background-image:url('img/icon_mail_alt.png')\" onclick=\""+this.ref+".fonchange_action('message')\" ontouchstart=\"this.style.color='orange'\" ontouchend=\"this.style.color=''\"><a>Messages</a><div class='ind' id='nbr_msg_ind'></div></li>" +
				"<li style=\"background-image:url('img/icon_contacts_alt.png')\" onclick=\""+this.ref+".fonchange_action('contact')\" ontouchstart=\"this.style.color='orange'\" ontouchend=\"this.style.color=''\"><a>Contacts</a></li>" +
				"<li style=\"background-image:url('img/icon_document_alt.png')\" onclick=\""+this.ref+".fonchange_action('nonlu')\" ontouchstart=\"this.style.color='orange'\" ontouchend=\"this.style.color=''\"><a>Non lu</a></li>" +
				"<li class='title'>Mon compte</li>";
	
	if(droit(44))a["content"]+="<li style=\"background-image:url('img/icon_toolbox_alt.png')\" onclick=\""+this.ref+".fsupervision();\" ontouchstart=\"this.style.color='orange'\" ontouchend=\"this.style.color=''\"><a>Supervision</a></li>";
	a["content"]+="<li style=\"background-image:url('img/icon_adjust-vert.png')\" onclick=\""+this.ref+".fuser_setting();\" ontouchstart=\"this.style.color='orange'\" ontouchend=\"this.style.color=''\"><a>Préférences</a></li>" +
				"<li style=\"background-image:url('img/icon_error-circle_alt.png')\" onclick=\""+this.ref+".fabout_app();\" ontouchstart=\"this.style.color='orange'\" ontouchend=\"this.style.color=''\"><a>À propos</a></li>" +
				"</ul>";
	a["content"]+="</div>";
	
	this.nav_page=fnew_page(a,'');


	a=new Array();
	a["header"]="";	
	this.main_page=fnew_page(a,'');
	this.main_page.content.setAttribute("ontouchstart",this.ref+".fdrag_start(event)");
	this.main_page.content.setAttribute("ontouchmove",this.ref+".fdrag(event)");
	this.main_page.content.setAttribute("ontouchend",this.ref+".fdrag_end(event)");
	
	//charger le contenue
	this.agrp[this.ncli_active].fdisplay(this.main_page);
	this.fshow_ind_msg(this.ncli_active);
	
	//alert s'il y a une nouvelle version
	if(user.new_version>version_app){
		setTimeout("fconfirm(\"Il y a une nouvelle version de l'application, voulez-vous la mettre à jour?\",'fgoto_app_store()','',120)",6000);
	}	
}

cconsole.prototype.fonchange_client=function(ncli){
	if(!this.main_page)return false;
	this.fnav();
	if(this.ncli_active==ncli)return;
	this.agrp[this.ncli_active].fhide();
	this.ncli_active=ncli;
	this.agrp[ncli].fdisplay(this.main_page);
	this.fshow_ind_msg(ncli);
}

cconsole.prototype.fshow_ind_msg=function(ncli){
	var hnbm=document.getElementById("nbr_msg_ind");
	if(!hnbm)return;
	if(typeof(anbrmsg)=='undefined')anbrmsg=new Array();
	if(typeof(anbrmsg["n"+ncli])=='undefined')anbrmsg["n"+ncli]=0;
	if(!anbrmsg["n"+ncli])hnbm.style.display='none';
	else{
		hnbm.style.display='';
		hnbm.innerHTML=anbrmsg["n"+ncli];
	}
}

cconsole.prototype.fonchange_action=function(_action){
	this.fnav();
	if(_action=='message'){
		var hnbm=document.getElementById("nbr_msg_ind");
		hnbm.style.display='none';
		anbrmsg["n"+this.ncli_active]=0;
	}
	if(this.agrp[this.ncli_active].action==_action)return;
	this.agrp[this.ncli_active].fdisplay(this.main_page.content,_action);
}

cconsole.prototype.fsupervision=function(){
	this.nav_open=false;
	this.main_page.container.className="page nav_open";
	if(!this.osv_calls)this.osv_calls=new csv_calls(this.ref+".osv_calls",this.pref+"sv_calls",this);
	this.osv_calls.finitial();
}

cconsole.prototype.fsync_config=function(ncli){
	this.nav_open=false;
	this.agrp[ncli].fsetting();
}

cconsole.prototype.fuser_setting=function(){
	this.nav_open=false;
	this.main_page.container.className="page nav_open";
	var a=new Array();
	a["header"]="<a onClick=\"fback_history();\" class='menu_left' style=\"background:url('img/arrow_carrot-left.png') no-repeat left center\"> </a>";
	a["header"]+="<a onClick=\""+this.ref+".fuser_setting_save();\" class='menu_right' style=\"background:url('img/icon_check.png') no-repeat center center;background-size:23px auto;\"> </a>";
	a["content"]="<div class='bdiv scr'><table class='struct'>";	
	a["content"]+="<tr><td colspan='3' style='color:#777;font-weight:bold;'>Général <hr /></td></tr>";
	a["content"]+="<tr><td colspan='3'>"+text(this.pref+"user_nom_usuel",'',"placeholder='Nom usuel'",(user && user.nom_usuel) ? user.nom_usuel : "")+"</td></tr>";
	var ar=new Array();
	ar[" "]="-";
	ar['M.']="M.";
	ar['Mme']="Mme";
	ar['Mlle']="Mlle";
	ar['Dr.']="Dr.";
	ar['Pr']="Pr.";
	ar['Me']="Me";
	this.oscivi=new cselect(this.ref+".oscivi",this.pref+"scivi",ar,(user && user.civilite) ? user.civilite : " ");
	a["content"]+="<tr><td style='width:50px;'>"+this.oscivi.fcreate("style='margin-top:-9px;'")+"</td><td>"+
				text(this.pref+"user_nom",'',"placeholder='Nom'",(user && user.nom) ? user.nom : "")+"</td><td>"+
				text(this.pref+"user_prenom",'',"placeholder='Prenom'",(user && user.prenom) ? user.prenom : "")+"</td></tr>";
	a["content"]+="<tr><td colspan='3'>"+text(this.pref+"user_mail1",'',"placeholder='Emails'",(user && user.mail1) ? user.mail1 : "")+"</td></tr>";
	a["content"]+="<tr><td colspan='3'>"+text(this.pref+"user_tel_mobile",'',"placeholder='Tel. mobile'",(user && user.tel_mobile) ? ftel_lisible(user.tel_mobile) : "")+"</td></tr>";
	a["content"]+="<tr><td colspan='3'>"+text(this.pref+"user_tel_pro",'',"placeholder='Tel. pro'",(user && user.tel_pro) ? ftel_lisible(user.tel_pro) : "")+"</td></tr>";
	a["content"]+="<tr><td colspan='3'>"+text(this.pref+"user_tel_pri",'',"placeholder='Tel. pri'",(user && user.tel_pri) ? ftel_lisible(user.tel_pri) : "")+"</td></tr>";
	a["content"]+="<tr><td colspan='3'>"+text(this.pref+"user_fax_pro",'',"placeholder='Fax(es)'",(user && user.fax_pro) ? ftel_lisible(user.fax_pro) : "")+"</td></tr>";
	a["content"]+="<tr><td colspan='3' style='color:#777;font-weight:bold;'><br>Fonctions <hr /></td></tr>";
	a["content"]+="<tr><td colspan='3'>"+button(this.pref+'btn_disconect',"","onClick=\"fconfirm('Voulez-vous vraiment vous déconnecter?','"+this.ref+".fdisconect()')\" style='background:red;'","Déconnexion")+"</td></tr>";
	a["content"]+="</table></div>";	
	this.config_page=fnew_page(a,"right");
}

cconsole.prototype.fuser_setting_save=function(){
	var req={};
	req.soapmethod="user";
	req.act="save";
	req.mdpch=1;
	req.nuser=user.n;
	req.n_sys_societes=user.nsoc;
	req.nom_usuel=document.getElementById(this.pref+"user_nom_usuel").value;
	req.civilite=this.oscivi.v;
	req.nom=document.getElementById(this.pref+"user_nom").value;
	req.prenom=document.getElementById(this.pref+"user_prenom").value;
	req.mail1=document.getElementById(this.pref+"user_mail1").value;
	req.tel_mobile=document.getElementById(this.pref+"user_tel_mobile").value;
	req.tel_pro=document.getElementById(this.pref+"user_tel_pro").value;
	req.tel_pri=document.getElementById(this.pref+"user_tel_pri").value;
	req.fax_pro=document.getElementById(this.pref+"user_fax_pro").value;
	
	if(req.nom_usuel==""){
		ftoast("Veuillez saisir un nom usuel.");
		return;
	}
	soap.call(req,this.fuser_setting_save_clb,this);
}

cconsole.prototype.fuser_setting_save_clb=function(r,rt,myobj,req){
	if(!r)return;
	var nus=r.selectSingleNode("./nus/text()").nodeValue;
	if(!nus){
		ftoast("Problème de connexion au serveur, veuillez réessayer plus tard.");
		return;
	}
	user.nom_usuel=req.nom_usuel;
	user.civilite=req.civilite;
	user.nom=req.nom;
	user.prenom=req.prenom;
	user.mail1=req.mail1;
	user.tel_mobile=req.tel_mobile;
	user.tel_pro=req.tel_pro;
	user.tel_pri=req.tel_pri;
	user.fax_pro=req.fax_pro;
	ftoast("Enregistrement effectué.");
	fback_history('');
}

cconsole.prototype.fdisconect=function(){
	var req={
			soapmethod:'messagerie',
			act:'mobile_update_push_id',
			n:user.n,
			nsoc:user.nsoc,
			mobile_push_id:'none'
		}
	soap.call(req);
	var qry="update ncb_sys_contacts set ncb_ident=null,ncb_mdp=null where ncb_ident is not null and ncb_mdp is not null and n_sys_contact_pere=0";
	odb.query(qry,this);
	this.config_page.fdelete('');
	user=null;
	this.ncli_active=null;
	this.agrp=new Array();
	this.has_login=false;
	this.finitial();
}

cconsole.prototype.fabout_app=function(){
	this.nav_open=false;
	this.main_page.container.className="page nav_open";
	var a=new Array();
	a["header"]="<a onClick=\"fback_history();\" class='menu_left' style=\"background:url('img/arrow_carrot-left.png') no-repeat left center\"> </a>";
	a["content"]="<div class='bdiv scr' style='text-align:center;'>Version d'application: "+version_app_str+"</div>";	
	this.config_page=fnew_page(a,"right");
}

cconsole.prototype.flogin_page=function(){
	var a=new Array();
	a["content"]="<div class='divContentLogin'><table class='tableLogin'>";
	a["content"]+="<tr class='trTableLogin'><td><div class='divInputLogin'>"+inputElement(this.pref+"username","","class='inputLogin' placeholder='Identifiant'","","text")+"</div></td></tr>";
	a["content"]+="<tr class='trTableLogin'><td><div class='divInputLogin'>"+inputElement(this.pref+"pwd","","class='inputLogin' placeholder='Mot de passe'","","password")+"</div></td></tr>";
	a["content"]+="<tr class='trTableLogin'><td><br/><div class='divButtonLogin'>"+inputElement(this.pref+"buttonLogin","","onClick='"+this.ref+".flogin()'","SE CONNECTER", "button")+"</div></td></tr></table></div>";
	this.login_page=fnew_page(a,'');
}

cconsole.prototype.fnav=function(){
	if(apage[indpage]!=this.main_page)return;
	if(this.nav_open){
		this.nav_open=false;
		this.main_page.container.className="page nav_open";
		this.main_page.container.className ="page transition2 center";
	}else{		
		this.nav_open=true;
		this.main_page.container.className="page center";
		this.main_page.container.className ="page transition2 nav_open";	
	}
}
cconsole.prototype.fdrag_start=function(e){
	this.offsetX=e.pageX||e.touches[0].pageX;
	this.offsetY=e.pageY||e.touches[0].pageY;
	if(this.nav_open){		
		this.offsetLeft=wwin*0.82;
		this.main_page.container.className="page nav_open";
	}else{
		this.offsetLeft=0;
		this.main_page.container.className="page center";
	}
	this.dra=true;
	return false;
}

cconsole.prototype.fdrag=function(e){
	if(!this.dra)return false;
	if(Math.abs((e.pageX||e.touches[0].pageX)-this.offsetX)<Math.abs((e.pageY||e.touches[0].pageY)-this.offsetY)*3)return true;
	this.moveleft=(e.pageX||e.touches[0].pageX)-this.offsetX+this.offsetLeft;
	if(this.moveleft>wwin*0.82)this.moveleft=wwin*0.82;
	else if(this.moveleft<0)this.moveleft=0;
	this.main_page.container.style.WebkitTransform="translate3d("+(this.moveleft/wwin)*100+"%, 0, 0)";
	e.preventDefault();
	return false;
}

cconsole.prototype.fdrag_end=function(e){
	if(!this.dra)return false;
	this.dra=false;
	if(!this.main_page.container.style.WebkitTransform && !this.nav_open)return false;
	this.main_page.container.style.WebkitTransform="";
	if(this.nav_open){
		if(this.moveleft-this.offsetLeft<-80){
			this.nav_open=false;
			this.main_page.container.className ="page transition1 center";
		}else{
			this.nav_open=true;
			this.main_page.container.className ="page transition1 nav_open";
		}	
	}else{
		if(this.moveleft-this.offsetLeft>80){
			this.nav_open=true;
			this.main_page.container.className ="page transition1 nav_open";
		}else{
			this.nav_open=false;
			this.main_page.container.className ="page transition1 center";
		}	
	}	
	return false;
}

cconsole.prototype.fonline=function(){
	if(!this.ncli_active || !this.agrp[this.ncli_active])return;
	setTimeout(this.ref+".agrp["+this.ref+".ncli_active].fonline()",3000);
}

cconsole.prototype.foffline=function(){
	ftoast("Vous n'êtes pas connecté à Internet.");
}

// handle GCM notifications for Android
cconsole.prototype.onNotification=function(e){
 	switch(e.event){
 	  case 'registered':
    	// Your GCM push server needs to know the regID before it can push to this device
		// here is where you might want to send it the regID for later use.
		if(e.regid)mobile_push_id="add"+e.regid;
      break;       
      case 'message':
      	// if this flag is set, this notification happened while we were in the foreground.
      	// you might want to play a sound to get the user's attention, throw up a dialog, etc.
    	this.fhandle_notification();
      break;
      
      case 'error':
    	  ftoast('ERROR -> MSG:' + e.msg);
      break;
      
      default:
    	  ftoast('EVENT -> Unknown, an event was received and we do not know what it is');
      break;
    }
}

//handle APNS notifications for iOS
cconsole.prototype.onNotificationAPN=function(e){
	this.fhandle_notification();
}

cconsole.prototype.fhandle_notification=function(){
	if(!user || !user.n || !this.agrp[user.n] || !this.main_page)return;
	if(this.ncli_active!=user.n){
		this.agrp[this.ncli_active].fhide();
		this.ncli_active=user.n;
		this.agrp[user.n].fdisplay(this.main_page);
		if(this.users_select)this.users_select.fselected(user.n);
	}
	
	if(this.agrp[user.n].omessage)this.agrp[user.n].omessage.fsync_message();
	this.agrp[user.n].fshow('message');
	
	var hnbm=document.getElementById("nbr_msg_ind");
	hnbm.style.display='none';
	anbrmsg["n"+user.n]=0;	
}
