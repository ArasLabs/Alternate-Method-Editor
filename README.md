# Alternate Method Editor

[Visual Studio Code](https://code.visualstudio.com/) has quickly become one of the most popular code editors among software developers. Last year, Microsoft released the browser-based editor that powers VS Code as a standalone application called the [Monaco Editor](https://github.com/Microsoft/monaco-editor). Out-of-the-box, the Monaco Editor supports Microsoft's signature [Intellisense](https://docs.microsoft.com/en-us/visualstudio/ide/using-intellisense) as well as the option to compare two different pieces of code.

As Visual Studio Code is the preferred code editor of many members of the Aras Labs team, this project aims to integrate the Monaco Editor into an alternate Method Form to allow for an enhanced developer experience 
for writing methods inside of Aras Innovator.

![screenshot](Screenshots/Embedded-Monaco-Editor.png)

## Project Details

#### Built Using:
Aras 11.0 SP15

#### History:
Release | Notes
--------|--------
[v1.2](https://github.com/ArasLabs/alternate-method-editor/releases/tag/v1.2) | Bug fixes
[v1.1](https://github.com/ArasLabs/alternate-method-editor/releases/tag/v1.1) | Initial Release. Tested on Chrome, Firefox 60 ESR, and Edge

#### Supported Aras Versions
Project | Notes
--------|--------
[v1.2](https://github.com/ArasLabs/alternate-method-editor/releases/tag/v1.2) | 11.0 SP15
[v1.1](https://github.com/ArasLabs/alternate-method-editor/releases/tag/v1.1) | 11.0 SP15

## Installation

#### Important!
**Always back up your code tree and database before applying an import package or code tree patch!**

### Pre-requisites

1. Aras Innovator installed (version 11.0 SP15 preferred)
2. Aras Package Import tool
3. AlternateMethodEditor import package

#### Code tree Installation

1. Backup your code tree and store the archive in a safe place
2. Navigate to your local `..\AlternateMethodEditor\` folder
3. Copy the `\Innovator\` folder
4. Paste this at the root of your install directory
    + By default this is `C:\Program Files\Aras\Innovator\`

#### Database Installation

1. Backup your database and store the BAK file in a safe place
2. Open up the Aras Package Import tool
3. Enter your login credentials and click **Login**
    * _Note: You must login as root for the package import to suceed!_
4. Enter the package name in the TargetRelease field
    * Optional: Enter a description in the Description field
5. Enter the path to your local `..\alternate-method-editor\Import\imports.mf` file in the Manifest File field
6. Select **aras.labs.AlternateMethodEditor** in the Available for Import field
7. Select Type = **Merge** and Mode = **Thorough Mode**
8. Click **Import** in the top-left corner
9. Close the Aras Package Import tool

####

You are now ready to login to Aras and try out the Alternate Method Editor

## Usage

1. Log in to Aras as admin
2. Navigate to **Administration > Methods**
3. Open any Method
4. Lock the Method
5. Begin typing into the Method Editor
6. Notice that there is now Intellisense suggesting words as you type

For more information on contributing to this project, another Aras Labs project, or any Aras Community project, shoot us an email at araslabs@aras.com.

## Future Features

1. Add the Monaco Editor as a sub-module of this project to easily stay up to date with the latest release and to cut down on the size of this project.
2. Integrate another toolbar button to allow for comparison of two different versions of a Method.
3. Add support for JavaScript parsing. (There is already a JS linter in this editor. The information from that linter just needs to be extracted and displayed to the user)
4. Making themes for the Monaco Editor is much simpler than it is for the Ace editor. It'd be cool to have a theme designer, though that may be a separate project

## Credits

Original Aras community project written by Christopher Gillis at Aras Corp.

Documented and published by Christopher Gillis for Aras Labs. @cgillis-aras

## Dependencies

* [Monaco Editor](https://github.com/Microsoft/monaco-editor)

## License

Aras Labs projects are published to Github under the MIT license. See the [LICENSE file](./LICENSE) for license rights and limitations.