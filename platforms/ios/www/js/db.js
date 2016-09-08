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


/* Requêtes créations tanbles */

function ncb_sys_contacts_table() {
    return "CREATE TABLE IF NOT EXISTS ncb_sys_contacts (" +
    "n INTEGER PRIMARY KEY," +
    "ncb_ident TEXT,ncb_mdp TEXT," +
    "nsoc0 INTEGER,nsoc INTEGER," +
    "civilite TEXT,nom_usuel TEXT,nom TEXT,prenom TEXT," +
    "tel_mobile TEXT,tel_pri TEXT,tel_pro TEXT,fax_pro TEXT,mail1 TEXT," +
    "clic_action INTEGER," +
    "n_sys_contact_pere INTEGER," +
    "rdvcolor TEXT,ag_duree_rdv_std INTEGER,ag_debut_agenda INTEGER,ag_fin_agenda INTEGER,ag_nbjours INTEGER," +
    "ldroits TEXT)";
}

function ind_contact_ident_index() {
    return "CREATE UNIQUE INDEX IF NOT EXISTS ind_contact_ident on ncb_sys_contacts(n_sys_contact_pere,ncb_ident,ncb_mdp)";
}

function ind_contact_nom_index() {
    return "CREATE INDEX IF NOT EXISTS ind_contact_nom on ncb_sys_contacts(nom_usuel,nom,prenom)";
}

function ncb_crm_actions_table() {
    return "CREATE TABLE IF NOT EXISTS ncb_crm_actions (" +
    "n_societe INTEGER," +
    "n INTEGER ," +
    "n_tp_action INTEGER," +
    "n_action_orig INTEGER,sous_tp INTEGER," +
    "sous_tp2 INTEGER," +
    "date_creation TIMESTAMP," +
    "dmod TIMESTAMP," +
    "n_crm_clients INTEGER," +
    "n_utilisateurs INTEGER," +
    "txt TEXT,lpj TEXT,lpj_name TEXT,resultat TEXT," +
    "perio_orig INTEGER," +
    "lco INTEGER,objet TEXT,emplacement TEXT," +
    "ddeb TIMESTAMP,dfin TIMESTAMP," +
    "jentier INTEGER,cout INTEGER," +
    "archive TEXT," +
    "catcouleur TEXT,nmotif INTEGER," +
    "ndossier INTEGER,nom_usuel_ut TEXT," +
    "rappel INTEGER,nv_client INTEGER,pasvenu INTEGER,dispo INTEGER," +
    "vis INTEGER,old INTEGER,prive INTEGER,lu INTEGER,trait INTEGER,depl INTEGER," +
    "imp INTEGER,nonfact INTEGER,webag INTEGER," +
    "lmedia TEXT,historique TEXT,copied INTEGER," +
    "PRIMARY KEY (n_action_orig, sous_tp))";
}

function ind_action_dte_index() {
    return "CREATE INDEX IF NOT EXISTS ind_action_dte on ncb_crm_actions(ddeb,dfin,n_tp_action)";
}

function ind_action_ncli_index() {
    return "CREATE INDEX IF NOT EXISTS ind_action_ncli on ncb_crm_actions(n_crm_clients)";
}

function ncb_crm_messages_table() {
    return "CREATE TABLE IF NOT EXISTS ncb_crm_messages (" +
    "n INTEGER PRIMARY KEY,n_crm_clients INTEGER,date_creation TIMESTAMP," +
    "lco INTEGER,objet TEXT,txt TEXT,n_utilisateurs INTEGER," +
    "catcouleur TEXT,id_externe INTEGER,sous_tp2 INTEGER,sous_tp INTEGER," +
    "lu INTEGER,old INTEGER,trait INTEGER,n_action_orig INTEGER," +
    "lpj TEXT,lpj_name TEXT,emplacement TEXT,prive INTEGER,msg_cat TEXT,important INTEGER," +
    "cli_societe INTEGER,cli_nom TEXT,cli_prenom TEXT,cli_nom_usuel TEXT,cli_fax_pro TEXT,cli_tel_mobile TEXT," +
    "cli_mail TEXT,cli_media TEXT,ut_societe INTEGER,ldroitsut TEXT,ut_nom TEXT,ut_prenom TEXT,ut_nom_usuel TEXT," +
    "co_tel_pri TEXT,co_tel_pro TEXT,co_tel_mobile TEXT,co_dte_naissance TEXT," +
    "co_mail1 TEXT,co_tel_adsl TEXT,co_tel_autre TEXT,co_tel_autre_des TEXT," +
    "ndossier INTEGER,dossier_nom TEXT,dossier_mail TEXT,dossier_fax_pro TEXT,dossier_tel_mobile TEXT," +
    "dossier_media TEXT,dossier_societe INTEGER)";
}

function ind_msg_ndossier_index() {
    return "CREATE INDEX IF NOT EXISTS ind_msg_ndossier on ncb_crm_messages(ndossier,date_creation)";
}

function ncb_tp_creneaux_table() {
    return "CREATE TABLE IF NOT EXISTS ncb_tp_creneaux(" +
    "n INTEGER PRIMARY KEY,rang INTEGER," +
    "ncli INTEGER,nsoc INTEGER,nsoc0 INTEGER,ngroup INTEGER," +
    "des TEXT,couleur TEXT," +
    "dispo INTEGER,duree INTEGER," +
    "txt TEXT,web TEXT,lmotif TEXT,lmotif_des TEXT," +
    "nmotifdef INTEGER,nbrdv INTEGER,ordre INTEGER," +
    "instruction TEXT,txt_rdv TEXT)";
}

function ind_creneaux_ncli_table() {
    return "CREATE INDEX IF NOT EXISTS ind_creneaux_ncli on ncb_tp_creneaux(ncli,nsoc)";
}

function ncb_tp_motifs_table() {
    return "CREATE TABLE IF NOT EXISTS ncb_tp_motifs(" +
    "n INTEGER PRIMARY KEY,rang INTEGER," +
    "ncli INTEGER,nsoc INTEGER,nsoc0 INTEGER,ngroup INTEGER," +
    "des TEXT,txt TEXT,couleur TEXT,gcalid TEXT," +
    "duree INTEGER,rappel INTEGER,ordre INTEGER," +
    "instruction TEXT,web INTEGER,rappel_msg TEXT)";
}

function ind_motifs_ncli_table() {
    return "CREATE INDEX IF NOT EXISTS ind_motifs_ncli on ncb_tp_motifs(ncli,nsoc)";
}

function ncb_local_config_table() {
    return "CREATE TABLE IF NOT EXISTS ncb_local_config(" +
    "ncli INTEGER PRIMARY KEY," +
    "ag_last_sync TIMESTAMP,msg_last_sync TIMESTAMP,con_last_sync TIMESTAMP," +
    "ag_aff TEXT,interval_ag INTEGER,interval_msg INTEGER,interval_con INTEGER)";
}

function ncb_sys_contacts_tel_table() {
	return "CREATE TABLE IF NOT EXISTS ncb_sys_contacts_tel (" +
	"nsoc INTEGER," +
	"nsoc0 INTEGER," +
	"nco INTEGER," +
	"des TEXT," +
	"val TEXT," +
	"rq TEXT," +
	"tp TEXT," +
	"msq INTEGER," +
	"dcre TIMESTAMP," +
	"suppr TIMESTAMP," +
	"ordre INTEGER," +
	"bdef INTEGER)";
}

function cdb_sqlite(db_name,db_version,db_displayname,db_size){
    
	this.db_name=db_name;
	this.db_version=db_version;
	this.db_displayname=db_displayname;
	this.db_size=db_size;
	this.db = window.openDatabase(db_name, db_version, db_displayname, db_size);
}

cdb_sqlite.prototype.transaction=function(populateDB, errorCB, successCB){
    this.db.transaction(populateDB, errorCB, successCB);
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




// Populate the database
function populateDB(tx) {
    tx.executeSql(ncb_sys_contacts_table());
    tx.executeSql(ind_contact_ident_index());
    tx.executeSql(ind_contact_nom_index());
    
    tx.executeSql(ncb_crm_actions_table());
    tx.executeSql(ind_action_dte_index());
    tx.executeSql(ind_action_ncli_index());
    
    tx.executeSql(ncb_crm_messages_table());
    tx.executeSql(ind_msg_ndossier_index());
    
    tx.executeSql(ncb_tp_creneaux_table());
    tx.executeSql(ind_creneaux_ncli_table());
    
    tx.executeSql(ncb_tp_motifs_table());
    tx.executeSql(ind_motifs_ncli_table());
    
    tx.executeSql(ncb_local_config_table());
}

// Transaction error callback
function errorCB(tx, err) {
    alert("Populate db version 1.0 error : "+err);
}

// Transaction success callback
function successCB() {
    alert("Populate db version 1.0 success!");
}

// Crée la bdd
var odb=new cdb_sqlite("ubicentrex_db", "", "ubicentrex_db", 1024*1024*40);
// Création des tables et index
odb.transaction(populateDB, errorCB, successCB);

alert("version : "+odb.db.version);

if (odb.db_version == "1.0") {
	
	try {
		odb.changeVersion("1.0", "2.0",
						 
						 function(trans) {
							//do initial setup
							tx.executeSql(ncb_sys_contacts_tel_table());
						 },
						 
						 //used for error
						 function(e) {
							log(JSON.stringify(e));
						 },
						 
						 //used for success
						 function() {
							log(db.version);
		 				 });
		
	} catch(e) {
		alert("Une erreur est survenue lors de la mise à jour de la base de donnée locale : "+e);
	}
	
}



