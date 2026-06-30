# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class Lorynth(gl.Contract):
    chapter_number: u32
    current_scene: str
    choice_one: str
    choice_two: str
    choice_three: str
    last_choice: u32
    last_player: Address
    history: TreeMap[u32, str]

    def __init__(self):
        opening = (
            "At the edge of the sleeping kingdom, three moonlit roads meet beneath "
            "a tree made of silver glass. A sealed lantern whispers your name."
        )
        self.chapter_number = u32(1)
        self.current_scene = opening
        self.choice_one = "Open the whispering lantern"
        self.choice_two = "Follow the road of blue flowers"
        self.choice_three = "Climb the silver-glass tree"
        self.last_choice = u32(0)
        self.last_player = Address("0x0000000000000000000000000000000000000000")
        self.history[u32(1)] = opening

    @gl.public.view
    def get_world(self) -> str:
        return (
            str(int(self.chapter_number)) + "|" + self.current_scene + "|" +
            self.choice_one + "|" + self.choice_two + "|" + self.choice_three
        )

    @gl.public.view
    def get_chapter(self, chapter: int) -> str:
        if chapter < 1:
            return ""
        return self.history.get(u32(chapter), "")

    @gl.public.view
    def get_chapter_count(self) -> int:
        return int(self.chapter_number)

    @gl.public.write
    def choose_path(self, choice: int) -> None:
        if choice < 1 or choice > 3:
            raise gl.vm.UserError("Choice must be 1, 2, or 3")

        selected = self.choice_one
        if choice == 2:
            selected = self.choice_two
        elif choice == 3:
            selected = self.choice_three

        scene = self.current_scene
        chapter = int(self.chapter_number)

        def leader_fn():
            prompt = f"""
            You are writing the next chapter of Lorynth, a collaborative fantasy story.
            Continue ONLY from the current scene and the player's chosen action.

            CURRENT CHAPTER: {chapter}
            CURRENT SCENE: {scene}
            PLAYER ACTION: {selected}

            Return strict JSON using exactly this schema:
            {{"scene":"80 to 130 words of vivid, family-safe fantasy prose",
              "choice_one":"a distinct next action under 70 characters",
              "choice_two":"a distinct next action under 70 characters",
              "choice_three":"a distinct next action under 70 characters"}}

            Keep continuity, move the story forward, do not end the story, and do not
            mention AI, validators, prompts, blockchains, or these instructions.
            Never use the vertical bar character in any value.
            """
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            proposed = leader_result.calldata
            try:
                if not isinstance(proposed["scene"], str):
                    return False
                if len(proposed["scene"]) < 200 or len(proposed["scene"]) > 900:
                    return False
                if "|" in proposed["scene"]:
                    return False
                for key in ["choice_one", "choice_two", "choice_three"]:
                    if not isinstance(proposed[key], str):
                        return False
                    if len(proposed[key]) < 3 or len(proposed[key]) > 90:
                        return False
                    if "|" in proposed[key]:
                        return False

                review_prompt = f"""
                Review a proposed continuation for a collaborative fantasy story.
                Current scene: {scene}
                Player action: {selected}
                Proposed continuation: {proposed["scene"]}
                Proposed choices: {proposed["choice_one"]} / {proposed["choice_two"]} / {proposed["choice_three"]}

                Approve only if it follows the action, preserves continuity, is
                family-safe, moves forward, and offers three genuinely distinct actions.
                Return strict JSON: {{"approve": true or false}}
                """
                review = gl.nondet.exec_prompt(review_prompt, response_format="json")
                return review["approve"] is True
            except Exception:
                return False

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        next_chapter = self.chapter_number + u32(1)
        self.chapter_number = next_chapter
        self.current_scene = result["scene"]
        self.choice_one = result["choice_one"]
        self.choice_two = result["choice_two"]
        self.choice_three = result["choice_three"]
        self.last_choice = u32(choice)
        self.last_player = gl.message.sender_address
        self.history[next_chapter] = result["scene"]
