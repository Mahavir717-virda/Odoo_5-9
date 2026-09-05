// const asynchandler = (reponseFunction) => async (req, res, next) => {
//   try {
//     await responseFunction(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       succsess: true,
//       message: error.message,
//     });
//   }
// };

const asynchandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next))
    .catch((err) => next(err));
  };
};

export default asynchandler;
