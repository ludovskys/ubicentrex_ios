function insert_qry(db_name,_params,replace){
	if(typeof(replace)=="undefined")replace=false;
	var qry=(replace==true ? "replace into " : "insert into ")+db_name;
	var f="";
	var v="";
	for(var p in _params){
		if(!in_array(p,window[db_name+"_field"]))continue;
		f+=p+",";
		v+="\""+_params[p]+"\",";
	}
	f=f.substr(0,f.length-1);
	v=v.substr(0,v.length-1);
	qry+="("+f+") values ("+v+")";
	return qry;
}

function update_qry(db_name,_params,where){
	var qry="update "+db_name +" set ";
	for(var p in _params){
		if(!in_array(p,window[db_name+"_field"]))continue;
		qry+=p+"=";
		if(isNaN(_params[p]))qry+="\""+_params[p]+"\",";
		else if(_params[p]==="")qry+="\"\",";
		else qry+=_params[p]+",";
	}
	qry=qry.substr(0,qry.length-1);
	qry+=" where "+where;
	return qry;
}

function cdb_sqlite(db_name,db_version,db_displayname,db_size){
	this.db_name=db_name;
	this.db_version=db_version;
	this.db_displayname=db_displayname;
	this.db_size=db_size;
    alert("window : "+window);
	this.db = window.openDatabase(db_name, db_version, db_displayname, db_size);
}

cdb_sqlite.prototype.query=function(qry,myobj,fsuccess_clb,ferror_clb,data_tp){
	if(qry instanceof Array){
		if(qry.length==0)return false;
		this.qry=qry;
	}else{
		if(!qry)return false;
		this.qry=[qry];
	}
	
	if(typeof(myobj)!="undefined" && myobj)this.myobj=myobj;
	else this.myobj=null;
	
	if(typeof(fsuccess_clb)!="function")this.fsuccess_clb=function(){}
	else this.fsuccess_clb=fsuccess_clb;
	
	if(typeof(ferror_clb)!="function")this.ferror_clb=function(){if(debug)console.log('-----execute sql failed------');};
	else this.ferror_clb=ferror_clb;
	
	if(typeof(data_tp)=="undefined")this.data_tp="array";
	else this.data_tp=data_tp;
	
	this.db.transaction(
		function(tx){
			for(var i in odb.qry){
				tx.executeSql(odb.qry[i],[],odb.fsuccess_request, odb.ferror_request);
				if(debug)console.log(odb.qry[i]);
			}
		},
		function(err){
			console.log((odb.myobj ? odb.myobj.ref : "")+" - "+err.message);
		},
		function(){
			console.log((odb.myobj ? odb.myobj.ref : "")+"-----transaction success-----");
		}
	);
}

cdb_sqlite.prototype.ferror_request=function(tx, err){
	console.log("Error processing SQL :"+err.message);
	odb.ferror_clb(odb.myobj);
}

cdb_sqlite.prototype.fsuccess_request=function(tx, results){
	var p=null;
	if(typeof(results)!='undefined' && results.rows.length){
		switch(odb.data_tp){
			case "array":
				p=new Array();
				var len=results.rows.length;
				if(debug)console.log("table: " + len + " rows found.");
			    for (var i=0; i<len; i++){
			    	p[i]=results.rows.item(i); 
			    	if(debug)console.log(obj2string(p[i]));
			    }
			break;
			case "arraysimple":
				p=results.rows.item(0);
				if(debug)console.log(obj2string(p));
			break;			
			case "list":
				p=results.rows.item(0);
				p=obj2string(p);
				if(debug)console.log(p);
			break;
			default:
				p=new Array();
				var len=results.rows.length;
				if(debug)console.log("table: " + len + " rows found.");
			    for (var i=0; i<len; i++){
			    	p[i]=results.rows.item(i); 
			    	if(debug)console.log(obj2string(p[i]));
			    }
			break;
		}
	}
	odb.fsuccess_clb(odb.myobj,p);
}

var odb=new cdb_sqlite("ubicentrex_db", "1.0", "ubicentrex_db", 1024*1024*40);

var ncb_sys_contacts_field=new Array('n','ncb_ident','ncb_mdp','nsoc0','nsoc','civilite','nom_usuel','nom','prenom',
		'tel_mobile','tel_pri','tel_pro','fax_pro','clic_action','mail1','n_sys_contact_pere',
		'rdvcolor','ag_duree_rdv_std','ag_debut_agenda','ag_fin_agenda','ag_nbjours','ldroits');

var ncb_crm_actions_field=new Array('n_societe','n','n_tp_action','sous_tp','sous_tp2','date_creation','dmod','n_crm_clients',
		'n_utilisateurs','txt','lpj','lpj_name','resultat','n_action_orig','perio_orig','lco','objet','emplacement','ddeb','dfin',
		'jentier','cout','archive','catcouleur','nmotif','ndossier','nom_usuel_ut','rappel','nv_client','pasvenu',
		'dispo','vis','old','prive','lu','trait','depl','imp','nonfact','webag','lmedia','historique','copied');

var ncb_crm_messages_field=new Array('n','n_crm_clients','date_creation','lco','objet','txt','n_utilisateurs','catcouleur','id_externe','sous_tp2','sous_tp',
		'lu','old','trait','n_action_orig','lpj','lpj_name','emplacement','prive','msg_cat','important','cli_societe','cli_nom','cli_prenom',
		'cli_nom_usuel','cli_fax_pro','cli_tel_mobile','cli_mail','cli_media','ut_societe','ldroitsut','ut_nom','ut_prenom','ut_nom_usuel',
		'co_tel_pri','co_tel_pro','co_tel_mobile','co_dte_naissance','co_mail1','co_tel_adsl','co_tel_autre','co_tel_autre_des','ndossier',
		'dossier_nom','dossier_mail','dossier_fax_pro','dossier_tel_mobile','dossier_media','dossier_societe');

var ncb_tp_creneaux_field=new Array('n','rang','ncli','nsoc','nsoc0','ngroup','des','couleur','dispo','duree','txt','web',
		'lmotif','lmotif_des','nmotifdef','nbrdv','ordre','instruction','txt_rdv');

var ncb_tp_motifs_field=new Array('n','rang','ncli','nsoc','nsoc0','ngroup','des','txt','couleur','gcalid',
		'duree','rappel','ordre','instruction','web','rappel_msg');

var ncb_local_config_field=new Array('ncli','ag_last_sync','msg_last_sync','con_last_sync','ag_aff','interval_ag','interval_msg','interval_con');
