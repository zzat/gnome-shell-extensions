
const St = imports.gi.St;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const Mainloop = imports.mainloop;

const URL = 'http://static.cricinfo.com/rss/livescores.xml';

let _myPanelButton;

function _CricFeedButton () {
    this._init ();
}

_CricFeedButton.prototype = {
    __proto__   : PanelMenu.Button.prototype,

    _init       : function () {
                      PanelMenu.Button.prototype._init.call (this, 0.0);
                      
                      this._cricFeedButton = new St.Bin ({
                          style_class : 'panel-button',
                          reactive: true,
                          can_focus: true,
                          track_hover: true
                      });
                      
                      this._cricFeedIcon = new St.Icon ({
                          icon_name : 'media-record',
                          icon_type: St.IconType.SYMBOLIC,
                          style_class: 'system-status-icon'
                      });
                      
                      this._cricFeedButton.set_child (this._cricFeedIcon);
                      this.actor.add_actor (this._cricFeedButton);
                      /*this._mainBox = new St.BoxLayout ({
                          vertical : true
                      });
                      
                      this.menu.addActor (this._mainBox);*/
                      Main.panel._rightBox.insert_child_at_index (this.actor, 0);
                      Main.panel._menus.addMenu(this.menu);

                      this._cricFeedMenu = new PopupMenu.PopupMenuItem ("Loading...");
                      this.menu.addMenuItem (this._cricFeedMenu);
                      this._mainloop = Mainloop.timeout_add (1000, Lang.bind(this, function () {this._loadData(this);}));
                  },
                
    _loadData   : function (self) {
                      let _httpSession = new Soup.SessionAsync ();
                      Soup.Session.prototype.add_feature.call(_httpSession, new Soup.ProxyResolverDefault());
                      let message = Soup.Message.new('GET', URL);
                      _httpSession.queue_message(message, function(session, message) {
                           let cricFeed_data = message.response_body.data;
                           
                           let cricFeed_title_list = [];
                           let cricFeed_link_list = [];
                           let start = cricFeed_data.search ("<title>") + 7;    //skipping first title
                           cricFeed_data = cricFeed_data.slice (start);
                           let cricFeed_data_copy = cricFeed_data;
                           while ( (start = cricFeed_data.search ("<title>") + 7) != 6 ) { //run until search returns -1
                               cricFeed_data = cricFeed_data.slice (start);
                               let end = cricFeed_data.search ("</title>");
                               cricFeed_title_list.push ( cricFeed_data.slice (0, end) );
                               cricFeed_data = cricFeed_data.slice (end + 8);
                           }
                           
                           start = cricFeed_data_copy.search ("<link>") + 6;    //skipping first title
                           cricFeed_data_copy = cricFeed_data_copy.slice (start);
                           while ( (start = cricFeed_data_copy.search ("<link>") + 6) != 5 ) {
                               cricFeed_data_copy = cricFeed_data_copy.slice (start);
                               let end = cricFeed_data_copy.search ("</link>");
                               cricFeed_link_list.push ( cricFeed_data_copy.slice (0, end) );
                               cricFeed_data_copy = cricFeed_data_copy.slice (end + 7);
                           }
                           
                           self._displayData (cricFeed_title_list, cricFeed_link_list);
                      });
                      this._mainloop = Mainloop.timeout_add (60000, Lang.bind(this, function () {this._loadData(this);}));
                  },    

    _displayData : function (cricFeed_title_list, cricFeed_link_list) {
                       this.menu._getMenuItems().forEach(function (actor) { actor.destroy(); });
                       for (element in cricFeed_title_list) {
                           /*let labelBox = new St.Bin ({
                               style_class : ('cricFeed-labelBox' + (element % 2)), //use something
                               reactive : true,
                               track_hover : true
                           });*/
                           let label = new St.Label ({
                               style_class : 'cricFeed-label',
                               text : cricFeed_title_list [element]
                           });
                           let link = cricFeed_link_list [element];
                           let item = new PopupMenu.PopupMenuItem ('', {style_class : 'cricFeed-labelBox' + (element % 2)});
                           //labelBox.add_actor (label);
                           //item.addActor (label);
                           item.addActor (label);
                           item.connect('activate', Lang.bind(this, function () { this._openLink ([link]);}));
                           this.menu.addMenuItem (item);
                       }
                        //this._cricFeedMenu.label.set_text (cricFeed_title_list [0]);
                        //Mainloop.timeout_add_seconds (10, function () { this._loadData (url);});
                    },
                    
    _openLink : function (link) {
                    let app = Shell.AppSystem.get_default().lookup_app('firefox.desktop') || Shell.AppSystem.get_default().lookup_app('chromium.desktop') || Shell.AppSystem.get_default().lookup_app('web.desktop');
                    //link_uri = [link];
                    app.launch (0, link, -1);
                },
                     
    _onDestroy : function () {
                     //this.menu._getMenuItems().forEach(function (actor) { actor.destroy(); });
                     Mainloop.source_remove (this._mainloop);
                     Main.panel._rightBox.remove_actor (this.actor);
                     Main.panel._menus.removeMenu (this.menu);
                     }

};             
                
function init() {
}

function enable() {
    _myPanelButton = new _CricFeedButton ();
    //Mainloop.timeout_add (2000, function () { _myPanelButton._loadData ();});
}

function disable() {
    _myPanelButton._onDestroy();

}
