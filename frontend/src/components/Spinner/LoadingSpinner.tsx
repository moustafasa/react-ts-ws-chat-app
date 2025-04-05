import sass from "./LoadingSpinner.module.scss";

const LoadingSpinner = ({ showP = false }) => {
  return (
    <div className={sass.spinnerCont}>
      <div className={sass.spinner}></div>
      {showP && <p className={sass.label}>loading...</p>}
    </div>
  );
};

export default LoadingSpinner;
