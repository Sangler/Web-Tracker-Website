module.exports = (req, res, next)=>{
  if (req.session.email){
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
