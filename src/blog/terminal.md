title: How to configure zsh
description: A brief tutorial on how to make your terminal environment look modern but is still remain very minimal and performant.
keywords: linux, terminal, xterm, st, zsh, vim
date: 2018-05-07
---

# {{ title }}

Over the years of using Linux as my primary and only OS I had to embrace some
unavoidable facts. First, things tend to change and complex things tend to
break. Second, reinventing the wheel almost never pays off. And finally, it's
not that hard to make a new habit and sometimes it's better than adjusting your
workstation to your "intuitive" understanding that may change very soon.

So years ago I decided to only use the most common software and only the very
minimal personalized configuration on top of it.

I mostly need two applications, no matter what OS or desktop environment I run
- a terminal and a web browser.

## Terminal

This is the only GUI app you actually need if you work as a developer. Whether
you edit sources, debug, read Hacker News, answer your emails, chat, listen to
music - most of the time you will be staring into this utterly boring window of
your terminal. So let's make it work fast and look good.

In terms of [performance][] there are two primary choices here: [xterm][] and
[st][]. Both are very small and lightweight, `xterm` comes with X server by
default, `st` needs to be compiled manually, but since you are a developer that
should not scare you.

I will go with `xterm` here, but I have also been using `st` for many years and
have absolutely no regrets about it.

As for the visual aesthetics, there's not much UI in the terminal - it's a
rectangle with monospace text after all. You can adjust colors and you can
adjust the font.

Adjusting colors is now easier than ever. There is a special [web
page][terminal-sexy] where you can find a ready-to-use color scheme, see it in
action and copy the configuration into `~/.Xresources`. I ended up using
"Eighties" theme, and it seems to be popular these days. Solarized or Molokai
are also good alternatives.

On Ubuntu there might be a catch that generated configuration snippet uses
`*.color0` wildcard, while the way Ubuntu loads `.Xresources` requires you to
replace it with `XTerm.vt100.color0`. Fortunately, this can be easily done in
almost any text editor.

For the fonts I find Roboto Mono and Ubuntu Mono fairly good, but you may have
a different taste.

My resulting `.Xresources` looks like this (it only tweaks font rendering, sets
font and colors, and allows Alt key to be used in Tmux or vim shortcuts):

```
Xft.rgba: rgb
XTerm.termName: xterm-256color
XTerm.vt100.faceName: Roboto Mono Regular:size=10
XTerm.vt100.metaSendsEscape: true
XTerm.vt100.foreground:   #d3d0c8
XTerm.vt100.background:   #2d2d2d
XTerm.vt100.cursorColor:  #d3d0c8
XTerm.vt100.color0:       #2d2d2d
XTerm.vt100.color8:       #747369
XTerm.vt100.color1:       #f2777a
XTerm.vt100.color9:       #f2777a
XTerm.vt100.color2:       #99cc99
XTerm.vt100.color10:      #99cc99
XTerm.vt100.color3:       #ffcc66
XTerm.vt100.color11:      #ffcc66
XTerm.vt100.color4:       #6699cc
XTerm.vt100.color12:      #6699cc
XTerm.vt100.color5:       #cc99cc
XTerm.vt100.color13:      #cc99cc
XTerm.vt100.color6:       #66cccc
XTerm.vt100.color14:      #66cccc
XTerm.vt100.color7:       #d3d0c8
XTerm.vt100.color15:      #f2f0ec
```

To make xterm my default terminal that is launched on Ctrl+Alt+T I had to run:

```
gsettings set org.gnome.desktop.default-applications.terminal exec 'xterm'
```

I also have made the following `~/.local/share/applications/xterm.desktop` file
to replace the unbearable XTerm icon:

```
[Desktop Entry]
Name=xterm
Comment=Use the command line
Exec=/usr/bin/xterm
Icon=utilities-terminal
Type=Application
Categories=GNOME;GTK;Utility;TerminalEmulator;
StartupNotify=true
OnlyShowIn=GNOME;Unity;
Keywords=Run;
Actions=New

[Desktop Action New]
Name=New Terminal
Exec=/usr/bin/xterm
OnlyShowIn=Unity
```

Reboot (or log out + log in) to apply the new configuration and your terminal
is good to do.

## zsh

UNIX Shell is my primary user interface to everything. And despite `fish` is
really cool and modern, or `rc` is so simple and nicely implemented, I tend to
stick to Bash or Zsh.

I'm still looking at backporting my zsh config to bash, but at the moment I'm a
Zsh user. Zsh is more user-friendly and more advanced, but it's never the
default shell and it also can be slow. For example, there is a wonderful
[oh-my-zsh][] project that allows you to build zsh config from the pieces, but
it's not uncommon when the shell start up time raises to 3 seconds or even
slower.

I try to keep my `.zshrc` as small as possible. I am using only 3 zsh modules
- autocompletion, colors and VCS info:

```
autoload -U compinit colors vcs_info
colors
compinit
```

Then I set up general zsh options and history:

I like when my shell keeps a lot of history. I also want to remember only one
line for each command and ignore certain commands that I prefix with a
whitespace (Bash can do it, too, so I'd better make a habit to put a whitespace
than set up complex shell rules for that). Finally, I want zsh to correct my
typos.

```
# Report command running time if it is more than 3 seconds
REPORTTIME=3
# Keep a lot of history
HISTFILE=~/.zhistory
HISTSIZE=5000
SAVEHIST=5000
# Add commands to history as they are entered, don't wait for shell to exit
setopt INC_APPEND_HISTORY
# Also remember command start time and duration
setopt EXTENDED_HISTORY
# Do not keep duplicate commands in history
setopt HIST_IGNORE_ALL_DUPS
# Do not remember commands that start with a whitespace
setopt HIST_IGNORE_SPACE
# Correct spelling of all arguments in the command line
setopt CORRECT_ALL
# Enable autocompletion
zstyle ':completion:*' completer _complete _correct _approximate 
```

The next thing to set up is shell prompt.

## propmt

Shell prompt should be concise and informative. I believe that colors and
unicode symbols are the way to go.

A good example for inspiration are [pure][] and [geometry][] themes.

I wanted my prompt to display:

- current working directory
- superuser flag
- whether last command exit status was zero or non
- vi mode (I use vim keybindings in the shell)
- git branch, staged and unstaged files (only if directory is a git repo)

```
zstyle ':vcs_info:*' stagedstr '%F{green}●%f '
zstyle ':vcs_info:*' unstagedstr '%F{yellow}●%f '
zstyle ':vcs_info:git:*' check-for-changes true
zstyle ':vcs_info:git*' formats "%F{blue}%b%f %u%c"

_setup_ps1() {
  vcs_info
  GLYPH="▲"
  [ "x$KEYMAP" = "xvicmd" ] && GLYPH="▼"
  PS1=" %(?.%F{blue}.%F{red})$GLYPH%f %(1j.%F{cyan}[%j]%f .)%F{blue}%~%f %(!.%F{red}#%f .)"
  RPROMPT="$vcs_info_msg_0_"
}
_setup_ps1

# Vi mode
zle-keymap-select () {
 _setup_ps1
  zle reset-prompt
}
zle -N zle-keymap-select
zle-line-init () {
  zle -K viins
}
zle -N zle-line-init
bindkey -v
```

I use vcsinfo module to provide information about git repos (as well as hg,
svn, csv as a bonus). I use `bindkey -v` to enable vi editing mode. I dropped
in a few functions to start with insert mode by default and to re-evaluate
prompt on each command.

This gives me a very minimal prompt that looks like this:

![xterm](/images/xterm.png)

## minor notes

I also have a few more lines in my zshrc that bind/fix common keys for
home/end/delete. And I also added one and only alias to have colored output in `ls`:

```
# Common emacs bindings for vi mode
bindkey '\e[3~'   delete-char
bindkey '^A'      beginning-of-line
bindkey '^E'      end-of-line
bindkey '^R'      history-incremental-pattern-search-backward
# Tmux home/end
bindkey '\e[1~'      beginning-of-line
bindkey '\e[4~'      end-of-line
# Urxvt
bindkey '\e[7~'      beginning-of-line
bindkey '\e[8~'      end-of-line
# user-friendly command output
export CLICOLOR=1
ls --color=auto &> /dev/null && alias ls='ls --color=auto'
```

You can see the full contents of zshrc here:
https://gist.github.com/zserge/1a315df99f5e7aed36d6ef0852eb18f1


[performance]: https://lwn.net/Articles/751763/
[xterm]: http://invisible-island.net/xterm/
[st]: https://st.suckless.org/
[terminal-sexy]: https://terminal.sexy
[oh-my-zsh]: http://ohmyz.sh/
[pure]: https://github.com/sindresorhus/pure
[geometry]: https://github.com/geometry-zsh/geometry
