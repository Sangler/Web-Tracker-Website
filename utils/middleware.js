module.exports = (req, res, next)=>{
  
  // Check if the user is authenticated using raw authentication
  if (req.session.user_id) {
    req.user_id = req.session.user_id;
    return next();
  }

  // Check if the user is authenticated using Other methods...
  /*
  if (other auth...) {
    return next();
  }...
  */
  res.redirect('/login')
};
