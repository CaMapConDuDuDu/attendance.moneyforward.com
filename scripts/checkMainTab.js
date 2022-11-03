window.onbeforeunload = () => window.hook ? "Did you save your stuff?" : ''
window.hook = true;