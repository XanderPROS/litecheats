$(document).ready(function(){
    var x=0;
    $( ".add" ).click(function(e){
        e.preventDefault();
       $(".downloadings").prepend(`
       <div class="form-inline">
                <div class="form-group col-4">
                    <label for="downloadname${x}">Name</label>
                    <input type="text" class="form-control" id="downloadname${x}" name="downloads[download${x}][name]">
                </div>
                <div class="form-group col-3">
                    <label for="downloadversion${x}">Version</label>
                    <input type="text" class="form-control" id="downloadversion${x}" name="downloads[download${x}][version]">
                </div>
                <div class="form-group col-3">
                    <label for="downloadfile${x}">File</label>
                    <input type="text" class="form-control" id="downloadfile${x}" name="downloads[download${x}][file]">
                </div>
                <div class="form-group col-4">
                        <label for="changelog${x}">Changelog</label>
                        <textarea class="form-control" name="downloads[download${x}][changelog]" id="changelog${x}" rows="10"></textarea>
                </div>
                <button class="remove col-2">Remove</button>
            </div>
       `)
       x=x+1;
    });
    var y=0;
    $( ".addi" ).click(function(e){
        e.preventDefault();
       $(".keying").append(`
       <div class="form-inline">
                    <div class="form-group col-6">
                        <label for="keytype${y}">KeyType</label>
                        <input type="text" class="form-control" id="keytype${y}" name="keys[key${y}][keyType]">
                    </div>
                    <div class="form-group col-6">
                        <label for="keyPrice${y}">Key Price</label>
                        <input type="text" class="form-control" id="keyPrice${y}" name="keys[key${y}][keyPrice]">
                    </div>
                    <div class="form-group col-6">
                        <label for="agentPrice${y}">Agent Price</label>
                        <input type="text" class="form-control" id="agentPrice${y}" name="keys[key${y}][agentPrice]">
                    </div>
                    <div class="form-group col-12">
                        <label for="keyList${y}">Key List</label>
                        <textarea class="form-control" id="keyList${y}" name="keys[key${y}][keyList]" rows="3" cols="50"></textarea>
                    </div>
                    <button class="remove col-2">Remove</button>
                </div>
       `)
       y=y+1;
    });
   
    $(document).on("click", ".remove", function(){
       $(this).parent().remove();
    });
 });