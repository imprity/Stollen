# Stollen

*it's like [pollen](https://git.matthewbutterick.com/mbutterick/pollen) but stolen (and bad)*

It's a simple markup langage that can be compiled(?) to tree of javascript objects.

# Basic Usage

```javascript
const st = require('stollen');

let text = 
`{|h1 class : title}[Hello World|]

{|div}[
    {|em}[Hi buddy!|]
    Sup~
    [|Howdy|]
|]

Goodbye World!
`

let [root, errorMsg] = st.parse(text, '');


/*produces tree that looks like this
{
    "attributeList": [],
    "attributeMap": {},
    "body": [
        {
            "attributeList": ["h1"],
            "attributeMap": {"class": "title"},
            "body": ["Hello World"]
        },
        "\n\n",
        {
            "attributeList": ["div"],
            "attributeMap": {},
            "body": [
                {
                    "attributeList": ["em"],
                    "attributeMap": {},
                    "body": ["Hi buddy!"]
                },
                "\nSup~\n",
                {
                    "attributeList": [],
                    "attributeMap": {},
                    "body": ["Howdy"]
                }
            ]
        },
        "\n\nGoodbye World!"
    ]
}
*/
```

# Syntax
Syntax is like this

```
outer text
{| attribute1 key : "and value"}[
    some text
    {|"child attribute 1" "child attribute 2"}[
        child text
    |]
    [|body with no attributes|]
    other text
|]
other outer text
```

And it will convert this file to javascript objects.

```javascript
//it also has a pointer to it's parent
//but I don't know how to describe circular relations with JSON
{
    "attributeList": [],
    "attributeMap": {},
    "body": [
        "outer text\n",
        {
            "attributeList": ["attribute1"],
            "attributeMap": {"key": "and value"},
            "body": [
                "some text\n",
                {
                    "attributeList": [
                        "child attribute 1",
                        "child attribute 2"
                    ],
                    "attributeMap": {},
                    "body": ["child text"]
                },
                "\n",
                {
                    "attributeList": [],
                    "attributeMap": {},
                    "body": ["body with no attributes"]
                },
                "\nother text"
            ]
        },
        "\nother outer text"
    ]
}
```

# White Space

Stollen mostly tries to keep whitespaces intact, ***except indents.***

It is mainly to make the original stollen code more readable.

This is how it works.

Stollen checks how much the first line is indented. For example :
```
{|animals}[
    cat
    dog
|]
```
In this case first line 'cat' starts with 4 spaces.
Stollen notices this and removes following lines 4 spaces.

But what about the cases where you want to start the text with tab or spaces?

In these cases, you can start your text with `|` and then insert whitespaces.

```
{|div}[
    |    This scentence starts after 4 spaces.
    |  And this starts after 2 spaces
|]
```

Stollen always ignore the first `|` after indent in multi-line text.

If you want to start your multi-line text with `|`, just put it two times   
(sorry but it was the best I could come up with)

# Escaping

Escape character is `@`. To type `@`, insert `@@`.

You only need to escape characters that are important in that context.

```
you always have to escpae
@@

in most outer body, you only need to escpae
@{| @[| @|]

{|
    in attributes you only need to escape
    @} @" @:
}
[
    same as most outer body, you only need to escpae
    @{| @[| @|]
|]
```

# TODO

* a way to add comment
* rigorous testing
* better code