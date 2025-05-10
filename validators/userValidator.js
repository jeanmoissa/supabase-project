const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0).max(120)
});

module.exports = {
  validateUser: (user) => userSchema.validate(user)
};