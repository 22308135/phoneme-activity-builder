# Development history evidence

The GitHub repository is the authoritative history. This summary makes the progression visible in the submitted source and gives the video presenter concrete commits to demonstrate.

| Commit | Development milestone |
| --- | --- |
| `56a414a` | Initial Next.js project |
| `216483f` | Dynamic Word Search grid sizes and phoneme hints |
| `39987af` | Project documentation, usability and limitations |
| `fcd5e59` | About-page and author-information improvements |
| `26505f6` | Database-backed activity save, edit and delete workflow |
| `2e35048` | Automated verification, security, accessibility and Assessment 2 documentation |
| `47a284d` | Assessment 1 feedback fixes: shared preferences, custom content links, accessible hints and modular generation |
| `cf02251` | Final About-page walkthrough video |
| `65fc27c` | Separate activity-library, creation and editing routes |
| `d630424` | Clear activity naming and activity-type-aware custom-content workflow |

Before recording, run these commands and show the output in the walkthrough:

```powershell
git log --oneline --decorate --graph --all
git show --stat 26505f6
git show --stat 2e35048
git show --stat 47a284d
git show --stat d630424
```

This evidence demonstrates incremental work across interface design, activity behaviour, persistence, accessibility, testing and documentation. The final GitHub URL is `https://github.com/22308135/phoneme-activity-builder`.
