Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    // logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },

    // integrationHeaders : {
    //     name : "CustomApp"
    // },
    

    launch: function() {
        var app =this;
        
        console.log('launch: function()  printing app - this  ' , app);
        //console.log('Ext ', Ext);
        // console.log('this.items ', this.items);
        
        
        // // for object types that may require a special "filter".
        // var queries = {
        //     // queries on PP with OID > 0 return all PP for sub... we want only this workspace PP
        //     'ProjectPermission':'(Workspace = ' + app.getContext().getWorkspace()._ref + ')'
        // }; 
        
        // console.log('queries ',queries);
        
        console.log('this.getContext().getWorkspace() ', app.getContext().getWorkspace() );
        // console.log('this.getContext().getContext().getUser ', app.getContext().getUser( ) );
        // console.log('this.getContext().getContext().getTimeboxScope ', app.getContext().getTimeboxScope( ) );

        
        // object types to report on.
        var all_object_types = { 
            'Attachment':'',
            'BuildDefinition':'',
            'Changeset':'',
            'ConversationPost':'',
            'Defect':'',
            'DefectSuite':'',
            'UserStory':'',
            'Iteration':'',
            'Milestone':'',
            'PortfolioItem':'',
            'PreliminaryEstimate':'',
            'Project':'',
            'ProjectPermission':'',
            'Release':'',
            'State':'',
            'Tag':'',
            'Task':'',
            'TestCase':'',
            'TestCaseResult':'',
            'TestCaseStep':'',
            'TestFolder':'',
            'TestSet':'',
            'User':''
        };  
        
        console.log(' all_object_types (init)', all_object_types);
        var objects_count = _.size(all_object_types);   // get the number of values in the list.
        console.log('objects_count: ',objects_count);    
        
        var all_object_query_filter = app._buildQueryFilter(all_object_types, app.getContext()); 
        console.log(' all_object_query_filter ', all_object_query_filter);
        

        Ext.Object.each(all_object_types, function(object_name){
            app._objectCounter(all_object_types,all_object_query_filter, object_name);
        }); 
        
        console.log(' all_object_types (counts)', all_object_types);
    }, // End launch: function() 
    
     

    // Object Counter 
     _objectCounter: function (all_object_types,all_object_query_filter, object_name){
        //var app = this;
        all_object_types.object_name = '...(still loading, please wait)...';
        
        Ext.create('Rally.data.wsapi.Store',{
            filters: all_object_query_filter.object_name,
            model: object_name,
            autoLoad: true, 

            listeners: {
                load: function(store,records){
                    all_object_types[object_name] = store.getTotalCount();
                }   
            }              

            
        });

    },
    

    _buildQueryFilter: function (all_object_types){
        var app = this; 
        var all_object_query_filter = { }; 

        Ext.Object.each(all_object_types, function(object_name){
            
            var filter ='';   
            
            switch(object_name) {
                case 'Attachment':
                     all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter 
                     break;
                case 'BuildDefinition':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'Changeset':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'ConversationPost':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'Defect':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'DefectSuite':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'UserStory':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'Iteration':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'Milestone':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'PortfolioItem':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'PreliminaryEstimate':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'Project':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'ProjectPermission':
                    filter = '(Workspace = ' + app.getContext().getWorkspace()._ref + ')'; 
                    all_object_query_filter[object_name] = Rally.data.wsapi.Filter.fromQueryString(filter); 
                    break;
                case 'Release':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'State':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'Tag':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'Task':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_typesblock
                    break;
                case 'TestCase':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'TestCaseResult':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'TestCaseStep':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'TestFolder':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;
                case 'TestSet':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;                
                case 'User':
                    all_object_query_filter[object_name] =[]; // assume no filter // remove if building a filter all_object_types
                    break;   
                default:
                   return [];
             }          
        });
     return all_object_query_filter; 
    } // End _buildQueryFilter
    
    
});  // End Ext.define() class 
