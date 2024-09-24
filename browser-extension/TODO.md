# OWASP Privacy Toolkit Browser Extension

Browser extension with privacy-related scanning capabilities, developed by IMQ Minded Security in the context of the TESTABLE H2020 project.

## Current status

The browser extension is now under development and any feature may change in any moment. 

## ToDo UI/Refactor

- [ ] Create a DropDown UI
- [ ] Develop a scoring mechanism
- [ ] Present results to the user, by using a badge showing the score of the website and other data using the application DropDown UI
- [ ] Develop Unit Tests (very optional)
- [ ] Setup a CI/CD (che fa figo)
- [ ] Review manifest.json metadata
- [ ] Create a script to update from https://github.com/lupomontero/psl.git
- [X] Refactor the Extension structure
- [X] Inject base scripts as the very first action on each webpage

### TODO Privacy Plugin

- [X] First Script Sequences monitoring strategy
- [X] Second Script Sequence adding also static scripts
- [X] Create a white list of CDNs in a separate js/json file for ease of maintenance (for script best practices).
- [ ] Prototype monitoring
- [X] Develop and integrate the oversharing plugin
- [X] Refactor the Globally Accessible Data (gadata.js) plugin, according to the reviewed architecture

