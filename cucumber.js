export default {
    default: {
      requireModule: ["@babel/register"],
      require: ["features/step-definitions/**/*.js"],
      format: ["progress-bar", "html:cucumber-report.html"],
      formatOptions: { snippetInterface: "async-await" },
      publishQuiet: true,
    },
  };
  