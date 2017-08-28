
$(document).ready(function(){
  $('code').addClass('JavaScript')

  $('.login').click(function(e){
    $('#login-modal').modal()
    console.log('he')

    return false
  })
  $('.confirm-delete').click(function(e){
    if(!confirm('Delete?')){
      e.preventDefault()
      return false
    }
  })
})
