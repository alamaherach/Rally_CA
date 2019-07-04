Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    
 
    launch: function() {
        //Write app code here

        this.start_time = new Date().getTime(); // meaure performance
        this.object_count = 0; // object to be loaded count, this prevent the vpde to run before the necessary data is available 
        
        // this.laundry =[]; // story not ready for sprint 
      
       this._loadIterations();
      // this._loadStoriesRecords();
      },
      
      
  /**  * Get iterationscomboBox  */
   _loadIterations : function (){
       var app = this;
        app.iterComboBox =  {
           xtype:'rallyiterationcombobox',
           itemId: 'iterComboBox-id',
           fieldLabel:'terations',
           labelAlign:'right',
        //   width:300,           
           listeners:{
               ready:  app._loadStoriesRecords,  // fires when combobox is ready , attaching method to this event
               select: app._loadStoriesRecords,  // fires when user make iteration selection , attaching method to this event
               scope:  app 
           }
      };
    //   this.myContainer.add(this.iterComboBox);
    app.add(app.iterComboBox);
    },
 
  /**  * get stories records using rally data store    */
   _loadStoriesRecords:function (){
        var app = this;
       
        var selectedIterationRef = app.down('#iterComboBox-id').getRecord().get('_ref');  
        // console.log(" selectedIterationRef " , selectedIterationRef); // get selected iteration name  
        
        var filter1 =  Rally.data.wsapi.Filter.fromQueryString('(Iteration = "'+ selectedIterationRef +'")'); 

        var storyFilters =   filter1; // filter1.and( filter2.or(filter3) );

        Ext.create('Rally.data.wsapi.Store', {
            model: 'hierarchicalrequirement', 
            filters: storyFilters,            
            autoLoad: true,
            limit: Infinity,
            sorters: [
                        { property: 'Rank', direction: 'ASC' }
                     ],  
            // limit: 500, // for quick debugging 
            listeners: {
                // load: app._start,
                load: function(store, data) {
                       console.log('loaded story data ', data);
                       app.object_count++; 
                       app.stories = data; // store stories' record data for later use
                       app._start("User Stories");       // process stories' record
                },
                scope: app
            },
          fetch: ['FormattedID', 'Name','Project','ScheduleState','PlanEstimate','c_AcceptanceCriteria','Defects:Summary[State]','Tasks','TaskRemainingTotal','Blocked','InProgressDate','Iteration']
        });            
    },          
    
   /** * main method , start computing when all data is loaded  */
   _start:function(from){
        var app = this; 
        
        app.laundry =[]; 
        // i can rename these criteria. 
        // However we cant change order since it is hard coded in the program 
        this.anti_pattern_criteria = [ 'IDs',
                                      'Size?',
                                      'Tasks?',
                                      'Acceptance Criteria?',
                                      'Blocked?',
                                     // 'Complete today?'
                                     ];
                                     
        this.anti_pattern_count   =  {'IDs'                 : 0,
                                     'Size?'               : 0,
                                     'Tasks?'              : 0,
                                     'Acceptance Criteria?': 0,
                                     'Blocked?'            : 0,
                                    // 'Complete today?'     : 0,
                                     };     
        
        if(app.object_count !== 1){ // data still loding 
            console.log('Not ready to start, still loading data :', from);
            return;
        }
        
         // data has finished loading 
         console.log('Data load completed at' , from ,' processing has started ');

        /**************************  Process Dirty User Stories ********************************************************* */        
        for (var i = 0 ; i < app.stories.length; i++ ){
            app._processUserStories(app.stories[i].raw); 
        }
        console.log('Dirty laundry Final' , app.laundry);
        console.log('legend Final' ,app.anti_pattern_count); 
    /************************** Show result ********************************************************* */  
       app._displayGrid();
       
       app.object_count = 0; //reset 
  },
  
  /**    * identify antipattern for a given user story    */
   _processUserStories:function(story){
    var app = this; 
    
    // console.log("Processing story  " ,  story); 

        // this.anti_pattern_criteria =  0 [ 'ID',      
        //                      1  'Need to be Sized',
        //                      2  'Need to be Tasked',
        //                      3  'Missing Acceptance Criteria',
        //                      4  'Blocked',
        //                      5  'Can be completed in a day '
        //                         ];    
    
    var row = {}; 

      var story_url = 'https://rally1.rallydev.com/#/search?keywords=' + story.FormattedID; 
      var story_url_html = '<a href="' + story_url+ '" target="_blank" >' +  story.FormattedID + "</a>"+ ": "+ story.Name + "<br>";
    
    row[app.anti_pattern_criteria[0]] = story_url_html; 
    row[app.anti_pattern_criteria[1]] = ''; 
    row[app.anti_pattern_criteria[2]] = ''; 
    row[app.anti_pattern_criteria[3]] = ''; 
    row[app.anti_pattern_criteria[4]] = ''; 
    row[app.anti_pattern_criteria[5]] = ''; 
    
    var add_to_laundry = false; 
    
    // ******* 3  Check for Acceptance Criteria 
    if(story.c_AcceptanceCriteria === null){
        row[app.anti_pattern_criteria[3]] = 'x'; 
        app.anti_pattern_count[app.anti_pattern_criteria[3]] += 1;  
        add_to_laundry = true; 
    }
    
    // *******  1 Check for Size ( Point Estimate)
    if(story.PlanEstimate === null){
        row[app.anti_pattern_criteria[1]] = 'x'; 
        app.anti_pattern_count[app.anti_pattern_criteria[1]] += 1;  
        add_to_laundry = true; 
    }    
    // ******* 4 Check for Blocked 
    if(story.Blocked){
        row[app.anti_pattern_criteria[4]] = 'x'; 
        app.anti_pattern_count[app.anti_pattern_criteria[4]] += 1;  
        add_to_laundry = true; 
    }      
    
    // ******* 2 Check for Tasks: stroy need to be tasked 
    if( (story.ScheduleState !== 'Accepted') && (story.PlanEstimate !== 0 ) && ( (story.TaskRemainingTotal === 0) || (story.TaskRemainingTotal === null)) ){
        row[app.anti_pattern_criteria[2]] = 'x'; 
        app.anti_pattern_count[app.anti_pattern_criteria[2]] += 1;  
        add_to_laundry = true; 
    }       
    
    // // ******* 5  Check if it can be completed in less than a day       
    // if( (story.Tasks.Count > 0) &&  (story.TaskRemainingTotal <= 5) ){
    //     row[app.anti_pattern_criteria[5]] = 'x'; 
    //     app.anti_pattern_count[app.anti_pattern_criteria[5]] += 1;  
    //     add_to_laundry = true; 
    // }         
    
        if(add_to_laundry){
            app.laundry.push(row);
        }
   },
  
  /**   * Display the repot "Jason Object" in a Grid    */
  _displayGrid: function(){
      var app = this; 
      app.laundry_store = {}; //reset 
        
     if(app.myGrid){ // Destroy grid if it already exist 
        // console.log('destroy grid ');
        app.myGrid.destroy(); 
      }      

      // build column metadata definition 
      var columns_definition =[] ;
      var row = {};
      row.width           = '29 %';  // do this for the first column only 
      for(var i = 0;  i< app.anti_pattern_criteria.length; i++){
              row.text            = app.anti_pattern_criteria[i];
              row.dataIndex       = app.anti_pattern_criteria[i];
              columns_definition.push(row);
              row={};
              row.width           = '12 %';  // afterirst column only 
          }  
        //   console.log('columns_definition ', columns_definition);
        
        
      // build grid legend
       var legend= ''; 
       var total = 0; 
       var delimiter = ' | ';
        for( var key in app.anti_pattern_count){
         if (app.anti_pattern_count.hasOwnProperty(key)) {
            if(key !== app.anti_pattern_criteria[0]){ // IDs 
                legend = legend + key + ': '+ app.anti_pattern_count[key] + '  '+ delimiter;
                total += app.anti_pattern_count[key];                
             }
           }
        } 
        legend = legend + '# of Issues: '+ total + '  '+ delimiter  + '# of Affected Stories: '+ app.laundry.length  + '  '+ delimiter  + '# of Stories in Sprint: '+ app.stories.length ;
        console.log('legend' , legend);
        
            
        app.laundry_store = Ext.create('Ext.data.Store', {
            storeId:'dirty_laundary',
            fields: app.anti_pattern_criteria,
            data: app.laundry,
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'items'
                }
            }
        });
        
        app.myGrid = Ext.create('Ext.grid.Panel', {
            title: 'laundry basket',
            store: app.laundry_store ,
            columns: columns_definition, 
            height: 800,
            width: '100%',   
            maxHeight:'100%',
            tbar: [ { xtype: 'label', html: legend }],
            renderTo: Ext.getBody()
        }); 
         
        app.add(app.myGrid);
   },

});